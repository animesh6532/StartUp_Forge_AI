"""Embeddings management"""

from app.core.logger import logger
from typing import List, Dict, Any
import numpy as np


class EmbeddingsManager:
    """Manager for document embeddings"""

    def __init__(self):
        self.logger = logger
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self._model = None
        self._initialized = False

    def _get_model(self):
        if not self._initialized:
            self._initialized = True
            try:
                self.logger.info(f"Lazy-loading SentenceTransformer model: {self.model_name}...")
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.model_name)
                self.logger.info("SentenceTransformer model loaded successfully.")
            except Exception as e:
                self.logger.warning(f"Failed to load SentenceTransformer ({e}). Using numeric hash fallback embedding generator.")
                self._model = None
        return self._model

    async def embed_documents(self, documents: List[str]) -> List[List[float]]:
        """Generate embeddings for documents"""
        self.logger.info(f"Generating embeddings for {len(documents)} documents")
        model = self._get_model()
        if model:
            try:
                embeddings = model.encode(documents)
                return [arr.tolist() for arr in embeddings]
            except Exception as e:
                self.logger.error(f"Error generating embeddings with model: {e}")
        
        # Fallback generator: deterministic float array from document hash
        return [self._hash_embed(doc) for doc in documents]

    async def embed_query(self, query: str) -> List[float]:
        """Generate embedding for query"""
        self.logger.info("Generating query embedding")
        model = self._get_model()
        if model:
            try:
                embedding = model.encode([query])[0]
                return embedding.tolist()
            except Exception as e:
                self.logger.error(f"Error generating query embedding with model: {e}")
        
        return self._hash_embed(query)

    def _hash_embed(self, text: str, dimension: int = 384) -> List[float]:
        """Deterministic fallback embedding generator"""
        import hashlib
        h = hashlib.sha256(text.encode("utf-8")).digest()
        # Seed NumPy locally to preserve thread safety and reproducibility
        rng = np.random.default_rng(int.from_bytes(h[:4], byteorder="big"))
        return rng.uniform(-1.0, 1.0, dimension).tolist()

    async def get_embeddings_info(self) -> Dict[str, Any]:
        """Get embeddings model information"""
        return {
            "model": self.model_name,
            "dimension": 384,  # For all-MiniLM-L6-v2
        }

