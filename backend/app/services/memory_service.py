"""Memory service for semantic search, save, and context injection"""

from app.core.logger import logger
from app.vectorstore.embeddings import EmbeddingsManager
from app.vectorstore.qdrant_manager import QdrantManager
from app.models.memory import MemoryModel
from sqlalchemy.orm import Session
import uuid
from typing import List, Dict, Any


class MemoryService:
    """Service for agent semantic memory operations with DB fallback mechanisms"""

    def __init__(self):
        self.logger = logger
        self.embeddings_manager = EmbeddingsManager()
        self.qdrant_manager = QdrantManager()
        self.collection_name = "startupforge_memories"
        self.vector_dim = 384
        self._init_collection()

    def _init_collection(self):
        import asyncio
        if self.qdrant_manager.client:
            try:
                # Run collection initialization safely in the background
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(self.qdrant_manager.create_collection(self.collection_name, self.vector_dim))
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(self.qdrant_manager.create_collection(self.collection_name, self.vector_dim))
            except Exception as e:
                self.logger.error(f"Error initializing Qdrant collection in MemoryService: {e}")

    async def save_memory(self, db: Session, content: str, startup_id: str = None, meta_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Save a new memory to PostgreSQL and Qdrant"""
        self.logger.info(f"Saving memory. Startup ID: {startup_id}")
        point_id = str(uuid.uuid4())
        
        # 1. Generate Embeddings
        vector = await self.embeddings_manager.embed_query(content)
        
        # 2. Try to save in Qdrant
        qdrant_success = False
        if self.qdrant_manager.client:
            qdrant_success = await self.qdrant_manager.upsert_vectors(
                collection_name=self.collection_name,
                vectors=[{
                    "id": point_id,
                    "vector": vector,
                    "payload": {
                        "startup_id": startup_id,
                        "content": content,
                        "meta_data": meta_data or {}
                    }
                }]
            )
            
        # 3. Save to relational DB
        db_memory = MemoryModel(
            id=point_id,
            startup_id=startup_id,
            qdrant_point_id=point_id if qdrant_success else None,
            content=content,
            meta_data=meta_data or {}
        )
        db.add(db_memory)
        db.commit()
        db.refresh(db_memory)
        
        return {
            "id": point_id,
            "qdrant_stored": qdrant_success,
            "content": content,
            "meta_data": meta_data or {}
        }

    async def semantic_search(self, db: Session, query: str, limit: int = 5, startup_id: str = None) -> List[Dict[str, Any]]:
        """Search similar memories. If Qdrant is offline, search via PostgreSQL filter matches."""
        self.logger.info(f"Performing memory search for: '{query}'")
        
        # 1. If Qdrant is online, do semantic search
        if self.qdrant_manager.client:
            try:
                query_vector = await self.embeddings_manager.embed_query(query)
                qdrant_results = await self.qdrant_manager.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    limit=limit
                )
                
                memories = []
                for res in qdrant_results:
                    payload = res.get("payload", {})
                    # Filter by startup_id if provided
                    if startup_id and payload.get("startup_id") != startup_id:
                        continue
                    memories.append({
                        "id": res["id"],
                        "score": res["score"],
                        "content": payload.get("content", ""),
                        "meta_data": payload.get("meta_data", {}),
                        "startup_id": payload.get("startup_id")
                    })
                if memories:
                    return memories
            except Exception as e:
                self.logger.error(f"Semantic search error: {e}. Falling back to PostgreSQL search.")
        
        # 2. Database Fallback (keyword/relational search)
        self.logger.info("Running PostgreSQL relational memory lookup fallback.")
        query_parts = query.lower().split()
        db_query = db.query(MemoryModel)
        if startup_id:
            db_query = db_query.filter(MemoryModel.startup_id == startup_id)
            
        results = db_query.all()
        
        # Calculate naive scoring based on keyword overlap for fallback ranking
        scored_results = []
        for row in results:
            score = 0.0
            content_lower = row.content.lower()
            for word in query_parts:
                if len(word) > 2 and word in content_lower:
                    score += 1.0
            # Boost score for perfect matches
            if query.lower() in content_lower:
                score += 5.0
            if score > 0 or not query_parts:
                scored_results.append((score, row))
                
        scored_results.sort(key=lambda x: x[0], reverse=True)
        
        memories = []
        for score, row in scored_results[:limit]:
            memories.append({
                "id": row.id,
                "score": score or 1.0,
                "content": row.content,
                "meta_data": row.meta_data,
                "startup_id": row.startup_id
            })
            
        return memories

    async def get_context_injection(self, db: Session, startup_info: dict, limit: int = 3) -> str:
        """Retrieve relevant historical agent contexts and format into LLM prompt instruction"""
        name = startup_info.get("name", "")
        desc = startup_info.get("description", "")
        industry = startup_info.get("industry", "")
        
        search_query = f"{name} {desc} {industry}"
        memories = await self.semantic_search(db, query=search_query, limit=limit)
        
        if not memories:
            return ""
            
        context_str = "\n--- RELEVANT VENTURE CONTEXTS FROM MEMORY ---\n"
        for i, mem in enumerate(memories):
            context_str += f"Context [{i+1}] (Relevance Score: {mem['score']}):\n{mem['content']}\n\n"
        context_str += "----------------------------------------------\n"
        return context_str
