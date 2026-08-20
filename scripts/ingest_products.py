#!/usr/bin/env python3
"""
Product Ingestion Script for AI Marketplace Assistant
Batch-processes products from data/products.json, generates embeddings,
and upserts vectors into Pinecone database.
"""

import sys
import json
import argparse
from pathlib import Path

# Configure utf-8 stdout for Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.utils.config import settings
from backend.models.product import Product
from backend.services.embedding_service import embedding_service
from backend.vector.pinecone_client import vector_store

def ingest_products(dry_run: bool = False, batch_size: int = 20):
    products_path = Path(settings.PRODUCTS_FILE_PATH)
    if not products_path.exists():
        print(f"[ERROR] Products file not found at {products_path}")
        sys.exit(1)

    print(f"[INFO] Loading products from: {products_path}")
    with open(products_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Found {len(data)} products.")
    products = [Product(**item) for item in data]

    # Group by category for stats
    category_counts = {}
    for p in products:
        category_counts[p.category] = category_counts.get(p.category, 0) + 1

    print("\nDataset Distribution:")
    for cat, count in category_counts.items():
        print(f"  * {cat.capitalize()}: {count} products")

    if dry_run:
        print("\n[DRY RUN] Simulating vector creation for first 3 products:")
        for p in products[:3]:
            doc_text = vector_store.format_product_for_embedding(p)
            vec = embedding_service.get_embedding(doc_text)
            print(f"\n--- Product: {p.name} (ID: {p.id}) ---")
            print(f"Embedding Dimension: {len(vec)}")
            print(f"Doc snippet:\n{doc_text[:200]}...")
        print("\n[SUCCESS] Dry run completed successfully. No remote changes made.")
        return

    print("\n[START] Beginning Pinecone Vector Ingestion...")
    print(f"Target Index: {settings.PINECONE_INDEX_NAME}")
    print(f"Pinecone Enabled: {vector_store.use_pinecone}")

    # Process in batches
    total_upserted = 0
    for i in range(0, len(products), batch_size):
        batch = products[i : i + batch_size]
        print(f"Processing batch {i//batch_size + 1} ({len(batch)} items)...")

        docs = [vector_store.format_product_for_embedding(p) for p in batch]
        embeddings = embedding_service.get_embeddings_batch(docs)

        for product, vector in zip(batch, embeddings):
            metadata = {
                "id": product.id,
                "name": product.name,
                "brand": product.brand,
                "category": product.category.lower(),
                "price": float(product.price),
                "rating": float(product.rating),
                "rating_count": product.rating_count,
                "description": product.description,
                "best_for": product.best_for
            }
            if vector_store.use_pinecone and vector_store.index:
                try:
                    vector_store.index.upsert(vectors=[(product.id, vector, metadata)])
                except Exception as e:
                    print(f"[ERROR] Failed to upsert {product.id} to Pinecone: {e}")
            
            # Keep in memory store updated
            vector_store._memory_vectors[product.id] = {
                "id": product.id,
                "values": vector,
                "metadata": metadata
            }
            vector_store._products_map[product.id] = product
            total_upserted += 1

    print(f"\n[SUCCESS] Successfully ingested {total_upserted} products into vector store!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest products into Pinecone Vector Database.")
    parser.add_argument("--dry-run", action="store_true", help="Test document generation and embeddings without upserting to remote Pinecone")
    parser.add_argument("--batch-size", type=int, default=20, help="Batch size for vector ingestion")
    args = parser.parse_args()

    ingest_products(dry_run=args.dry_run, batch_size=args.batch_size)
