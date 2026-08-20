import logging
import hashlib
import numpy as np
from typing import List, Dict, Optional
from backend.utils.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self._cache: Dict[str, List[float]] = {}
        self._openai_client = None
        self._init_client()

    def _init_client(self):
        if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip() and not settings.OPENAI_API_KEY.startswith("sk-placeholder"):
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI Embedding Client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize OpenAI client: {e}. Using deterministic semantic vectorizer fallback.")
                self._openai_client = None
        else:
            logger.info("No OpenAI API key provided. Using built-in semantic vectorizer.")

    def get_embedding(self, text: str) -> List[float]:
        """Generate a 1536-dimensional embedding vector for a single text string."""
        cleaned_text = text.strip()
        if not cleaned_text:
            return [0.0] * settings.EMBEDDING_DIMENSION

        if cleaned_text in self._cache:
            return self._cache[cleaned_text]

        if self._openai_client:
            try:
                response = self._openai_client.embeddings.create(
                    input=cleaned_text,
                    model=settings.OPENAI_EMBEDDING_MODEL
                )
                vector = response.data[0].embedding
                self._cache[cleaned_text] = vector
                return vector
            except Exception as e:
                logger.error(f"OpenAI embedding error: {e}. Falling back to local semantic vectorizer.")

        # Fallback local semantic vectorizer
        vector = self._generate_local_embedding(cleaned_text)
        self._cache[cleaned_text] = vector
        return vector

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        if not texts:
            return []

        # If OpenAI is available, do batch API call for uncached
        uncached_indices = [i for i, t in enumerate(texts) if t.strip() not in self._cache]
        
        if self._openai_client and uncached_indices:
            try:
                uncached_texts = [texts[i].strip() for i in uncached_indices]
                response = self._openai_client.embeddings.create(
                    input=uncached_texts,
                    model=settings.OPENAI_EMBEDDING_MODEL
                )
                for idx, data_item in zip(uncached_indices, response.data):
                    self._cache[texts[idx].strip()] = data_item.embedding
            except Exception as e:
                logger.error(f"OpenAI batch embedding error: {e}. Falling back to local embeddings.")
                for i in uncached_indices:
                    t = texts[i].strip()
                    self._cache[t] = self._generate_local_embedding(t)
        else:
            for t in texts:
                cleaned = t.strip()
                if cleaned not in self._cache:
                    self._cache[cleaned] = self._generate_local_embedding(cleaned)

        return [self._cache[t.strip()] for t in texts]

    def _generate_local_embedding(self, text: str, dimension: int = 1536) -> List[float]:
        """
        Deterministic, semantic-preserving local vector embedding.
        Constructs dense vector using multi-hash feature hashing and token n-grams.
        """
        words = text.lower().split()
        if not words:
            return [0.0] * dimension

        vector = np.zeros(dimension, dtype=np.float32)

        # 1. Word token hashing with semantic weighting
        for i, word in enumerate(words):
            # Base word hash
            h1 = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16) % dimension
            h2 = int(hashlib.sha256(word.encode('utf-8')).hexdigest(), 16) % dimension
            
            weight = 1.5 if len(word) > 4 else 1.0
            vector[h1] += weight
            vector[h2] += weight * 0.75

            # 2. Bigrams for phrases (e.g. "running shoes", "battery life", "rtx 4070")
            if i < len(words) - 1:
                bigram = f"{word} {words[i+1]}"
                hb = int(hashlib.sha1(bigram.encode('utf-8')).hexdigest(), 16) % dimension
                vector[hb] += 2.0

            # 3. Trigrams
            if i < len(words) - 2:
                trigram = f"{word} {words[i+1]} {words[i+2]}"
                ht = int(hashlib.sha256(trigram.encode('utf-8')).hexdigest(), 16) % dimension
                vector[ht] += 2.5

        # Normalize to unit vector for cosine distance
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        return vector.tolist()

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

embedding_service = EmbeddingService()
