import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.models.product import Product, SimilarProduct
from backend.vector.pinecone_client import vector_store
from backend.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("", response_model=List[Product])
def get_products(
    category: Optional[str] = Query(None, description="Filter by category (laptop, smartphone, headphones, shoes)"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price in INR"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price in INR"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    query: Optional[str] = Query(None, description="Keyword or semantic search query"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Retrieve all products with optional filtering and text/semantic search."""
    all_prods = vector_store.get_all_products()

    # Apply semantic vector search if query is provided
    if query and query.strip():
        q_vec = embedding_service.get_embedding(query.strip())
        candidates = vector_store.query_vectors(
            query_vector=q_vec,
            top_k=50,
            category=category,
            max_price=max_price
        )
        prods_map = {p.id: p for p in all_prods}
        filtered = [prods_map[c["id"]] for c in candidates if c["id"] in prods_map]
    else:
        filtered = all_prods

    # Apply strict filters
    result = []
    for p in filtered:
        if category and p.category.lower() != category.lower():
            continue
        if brand and p.brand.lower() != brand.lower():
            continue
        if min_price is not None and p.price < min_price:
            continue
        if max_price is not None and p.price > max_price:
            continue
        result.append(p)

    return result[offset : offset + limit]

@router.get("/{product_id}", response_model=Product)
def get_product_by_id(product_id: str):
    """Retrieve single product by ID."""
    product = vector_store.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")
    return product

@router.get("/{product_id}/similar", response_model=List[SimilarProduct])
def get_similar_products(
    product_id: str,
    limit: int = Query(4, ge=1, le=10)
):
    """Find semantically similar products using Pinecone vector embeddings."""
    target_product = vector_store.get_product_by_id(product_id)
    if not target_product:
        raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")

    if product_id in vector_store._memory_vectors:
        target_vector = vector_store._memory_vectors[product_id]["values"]
    else:
        doc_text = vector_store.format_product_for_embedding(target_product)
        target_vector = embedding_service.get_embedding(doc_text)

    # Query vector store for candidates
    candidates = vector_store.query_vectors(
        query_vector=target_vector,
        top_k=limit + 3,
        category=target_product.category
    )

    all_prods_map = {p.id: p for p in vector_store.get_all_products()}
    similar_list = []

    for c in candidates:
        if c["id"] == product_id:
            continue  # Skip self
        
        sim_product = all_prods_map.get(c["id"])
        if not sim_product:
            continue

        raw_score = float(c.get("score", 0.85))
        # Format reason based on shared attributes
        reason = f"Shares similar {sim_product.category} specifications and target audience ({', '.join(sim_product.best_for[:2])})."

        similar_list.append(
            SimilarProduct(
                product=sim_product,
                similarity_score=round(raw_score, 3),
                reason=reason
            )
        )

        if len(similar_list) >= limit:
            break

    return similar_list
