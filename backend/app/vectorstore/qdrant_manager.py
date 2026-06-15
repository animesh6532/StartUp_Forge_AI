"""Qdrant vector store manager"""

from app.core.logger import logger
from app.core.config import settings
from typing import List, Dict, Any


class QdrantManager:
    """Manager for Qdrant vector store operations"""

    def __init__(self):
        self.logger = logger
        self.host = settings.QDRANT_HOST
        self.port = settings.QDRANT_PORT
        self.api_key = settings.QDRANT_API_KEY
        self.client = None
        self._init_client()

    def _init_client(self):
        try:
            from qdrant_client import QdrantClient
            # Connection timeout to prevent blocking application boot
            self.client = QdrantClient(
                host=self.host,
                port=self.port,
                api_key=self.api_key if self.api_key else None,
                timeout=3.0
            )
            # Ping database by checking collections
            self.client.get_collections()
            self.logger.info(f"QdrantClient successfully connected to {self.host}:{self.port}")
        except Exception as e:
            self.logger.warning(
                f"Failed to connect to Qdrant vector store at {self.host}:{self.port} ({e}). "
                "Running in fallback memory management mode."
            )
            self.client = None

    async def create_collection(self, collection_name: str, vector_size: int) -> bool:
        """Create a new collection"""
        self.logger.info(f"Creating collection: {collection_name}")
        if not self.client:
            self.logger.warning(f"Qdrant offline: create_collection '{collection_name}' skipped.")
            return False
        try:
            from qdrant_client.http.models import Distance, VectorParams
            collections = self.client.get_collections().collections
            exists = any(c.name == collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
                )
                self.logger.info(f"Qdrant collection '{collection_name}' created.")
            return True
        except Exception as e:
            self.logger.error(f"Error creating collection in Qdrant: {e}")
            return False

    async def upsert_vectors(self, collection_name: str, vectors: List[Dict[str, Any]]) -> bool:
        """Upsert vectors into collection"""
        self.logger.info(f"Upserting {len(vectors)} vectors to {collection_name}")
        if not self.client:
            self.logger.warning(f"Qdrant offline: upsert_vectors '{collection_name}' skipped.")
            return False
        try:
            from qdrant_client.http.models import PointStruct
            points = []
            for item in vectors:
                points.append(
                    PointStruct(
                        id=item["id"],
                        vector=item["vector"],
                        payload=item.get("payload", {})
                    )
                )
            self.client.upsert(collection_name=collection_name, points=points)
            self.logger.info(f"Successfully upserted {len(vectors)} points to Qdrant collection '{collection_name}'")
            return True
        except Exception as e:
            self.logger.error(f"Error upserting vectors in Qdrant: {e}")
            return False

    async def search(self, collection_name: str, query_vector: List[float], limit: int = 10) -> List[Dict]:
        """Search for similar vectors"""
        self.logger.info(f"Searching in {collection_name}")
        if not self.client:
            self.logger.warning(f"Qdrant offline: search '{collection_name}' returning empty list.")
            return []
        try:
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit
            )
            output = []
            for res in results:
                output.append({
                    "id": res.id,
                    "score": res.score,
                    "payload": res.payload
                })
            return output
        except Exception as e:
            self.logger.error(f"Error searching in Qdrant: {e}")
            return []

    async def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection"""
        self.logger.info(f"Deleting collection: {collection_name}")
        if not self.client:
            self.logger.warning(f"Qdrant offline: delete_collection '{collection_name}' skipped.")
            return False
        try:
            self.client.delete_collection(collection_name=collection_name)
            return True
        except Exception as e:
            self.logger.error(f"Error deleting Qdrant collection: {e}")
            return False

