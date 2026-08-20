import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from backend.utils.config import settings, DATA_DIR
from backend.services.embedding_service import embedding_service
from backend.models.product import Product

logger = logging.getLogger(__name__)

class PineconeVectorStore:
    def __init__(self):
        self.use_pinecone = False
        self.pinecone_client = None
        self.index = None
        
        # In-memory vector index fallback
        self._memory_vectors: Dict[str, Dict[str, Any]] = {}
        self._products_map: Dict[str, Product] = {}
        
        self._init_pinecone()
        self._load_local_data()

    def _init_pinecone(self):
        if settings.PINECONE_API_KEY and settings.PINECONE_API_KEY.strip() and not settings.PINECONE_API_KEY.startswith("pcsk-placeholder"):
            try:
                from pinecone import Pinecone, ServerlessSpec
                self.pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)
                
                # Check if index exists or create
                existing_indexes = [idx.name for idx in self.pinecone_client.list_indexes()]
                if settings.PINECONE_INDEX_NAME not in existing_indexes:
                    logger.info(f"Creating Pinecone index '{settings.PINECONE_INDEX_NAME}'...")
                    try:
                        self.pinecone_client.create_index(
                            name=settings.PINECONE_INDEX_NAME,
                            dimension=settings.EMBEDDING_DIMENSION,
                            metric="cosine",
                            spec=ServerlessSpec(
                                cloud="aws",
                                region=settings.PINECONE_ENVIRONMENT
                            )
                        )
                    except Exception as ce:
                        logger.warning(f"Could not create index automatically: {ce}")
                
                self.index = self.pinecone_client.Index(settings.PINECONE_INDEX_NAME)
                self.use_pinecone = True
                logger.info(f"Pinecone connected successfully to index: {settings.PINECONE_INDEX_NAME}")
            except Exception as e:
                logger.warning(f"Failed to initialize Pinecone: {e}. Defaulting to high-speed in-memory vector store.")
                self.use_pinecone = False
        else:
            logger.info("No Pinecone API key configured. Using in-memory vector store.")

    def _load_local_data(self):
        """Loads products from data/products.json and vectorizes them into in-memory store."""
        try:
            products_path = Path(settings.PRODUCTS_FILE_PATH)
            if not products_path.exists():
                logger.warning(f"Products file not found at {products_path}")
                return

            with open(products_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            for item in data:
                product = Product(**item)
                self._products_map[product.id] = product

                # Construct rich document representation for vector embeddings
                doc_text = self.format_product_for_embedding(product)
                vector = embedding_service.get_embedding(doc_text)
                
                self._memory_vectors[product.id] = {
                    "id": product.id,
                    "values": vector,
                    "metadata": {
                        "id": product.id,
                        "name": product.name,
                        "brand": product.brand,
                        "category": product.category.lower(),
                        "price": float(product.price),
                        "rating": float(product.rating),
                        "description": product.description,
                        "best_for": product.best_for
                    }
                }
            logger.info(f"Successfully loaded {len(self._products_map)} products into vector engine.")
        except Exception as e:
            logger.error(f"Error loading local product data: {e}")

    @staticmethod
    def format_product_for_embedding(product: Product) -> str:
        """Create a rich semantic text representation for embedding."""
        specs_str = ", ".join([f"{k}: {v}" for k, v in product.specifications.items()])
        features_str = "\n".join([f"- {f}" for f in product.features])
        best_for_str = ", ".join(product.best_for)
        
        return (
            f"Product Name: {product.name}\n"
            f"Brand: {product.brand}\n"
            f"Category: {product.category}\n"
            f"Price: INR ₹{product.price:,.0f}\n"
            f"Rating: {product.rating} / 5.0\n"
            f"Description: {product.description}\n"
            f"Features:\n{features_str}\n"
            f"Specifications: {specs_str}\n"
            f"Best For: {best_for_str}"
        )

    def upsert_product(self, product: Product):
        """Upsert a single product to Pinecone and memory store."""
        doc_text = self.format_product_for_embedding(product)
        vector = embedding_service.get_embedding(doc_text)
        metadata = {
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "category": product.category.lower(),
            "price": float(product.price),
            "rating": float(product.rating),
            "description": product.description
        }
        
        self._products_map[product.id] = product
        self._memory_vectors[product.id] = {
            "id": product.id,
            "values": vector,
            "metadata": metadata
        }

        if self.use_pinecone and self.index:
            try:
                self.index.upsert(vectors=[(product.id, vector, metadata)])
            except Exception as e:
                logger.error(f"Pinecone upsert error for {product.id}: {e}")

    def query_vectors(
        self,
        query_vector: List[float],
        top_k: int = 8,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        target_price: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Query similar vectors from Pinecone or in-memory vector store."""
        # Pinecone query if enabled
        if self.use_pinecone and self.index:
            try:
                filter_dict = {}
                if category:
                    filter_dict["category"] = {"$eq": category.lower()}
                
                price_filter = {}
                if min_price:
                    price_filter["$gte"] = float(min_price * 0.90)
                if max_price:
                    price_filter["$lte"] = float(max_price * 1.10)
                if price_filter:
                    filter_dict["price"] = price_filter

                res = self.index.query(
                    vector=query_vector,
                    top_k=top_k,
                    include_metadata=True,
                    filter=filter_dict if filter_dict else None
                )
                
                results = []
                for match in res.matches:
                    results.append({
                        "id": match.id,
                        "score": float(match.score),
                        "metadata": match.metadata
                    })
                if results:
                    return results
            except Exception as e:
                logger.error(f"Pinecone query error: {e}. Falling back to memory vector search.")

        # In-memory cosine similarity query
        candidates = []
        for pid, item in self._memory_vectors.items():
            meta = item["metadata"]
            
            # Apply hard filter on category if explicitly identified
            if category and meta.get("category", "").lower() != category.lower():
                continue
                
            sim = embedding_service.cosine_similarity(query_vector, item["values"])
            candidates.append({
                "id": pid,
                "score": sim,
                "metadata": meta,
                "price": float(meta.get("price", 0))
            })

        # If min_price and/or max_price is specified, prioritize products within the exact bracket
        if min_price is not None or max_price is not None:
            effective_min = (min_price * 0.90) if min_price is not None else 0.0
            effective_max = (max_price * 1.10) if max_price is not None else float('inf')
            
            within_bracket = [
                c for c in candidates
                if effective_min <= c["price"] <= effective_max
            ]
            if within_bracket:
                # If target_price exists, sort by proximity to target then semantic score
                if target_price and target_price > 0:
                    within_bracket.sort(key=lambda x: (abs(x["price"] - target_price), -x["score"]))
                else:
                    within_bracket.sort(key=lambda x: x["score"], reverse=True)
                return within_bracket[:top_k]
            else:
                # If no products exist in exact range, sort by closeness to requested range
                anchor = target_price or max_price or min_price or 0.0
                candidates.sort(key=lambda x: (abs(x["price"] - anchor), -x["score"]))
                return candidates[:top_k]

        # Sort by similarity descending
        candidates.sort(key=lambda x: x["score"], reverse=True)
        return candidates[:top_k]

    def get_product_by_id(self, product_id: str) -> Optional[Product]:
        return self._products_map.get(product_id)

    def get_all_products(self) -> List[Product]:
        return list(self._products_map.values())

vector_store = PineconeVectorStore()
