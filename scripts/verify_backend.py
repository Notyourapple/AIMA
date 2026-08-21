#!/usr/bin/env python3
"""
Automated Backend & Vector Recommendation Test Suite
Tests FastAPI endpoints directly via TestClient:
- Health check (FastAPI, Ollama, Pinecone, OpenAI)
- AI Providers listing (/api/providers)
- Product Catalog & Filters
- Single Product & Similar Products (Pinecone/local embeddings)
- Conversational Shopping Flow with OpenAI & Ollama
"""

import sys
from pathlib import Path

# Configure utf-8 stdout for Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    print("\n--- Testing GET /api/health ---")
    response = client.get("/api/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    print(f"Status: {data['status']}, Total Products: {data['total_products']}")
    print(f"Services Breakdown: {data.get('services')}")
    assert data["total_products"] >= 60, "Expected at least 60 products loaded"
    assert "api" in data.get("services", {}), "Expected 'services.api' status"
    print("[PASS] Health check verified.")

def test_providers_endpoint():
    print("\n--- Testing GET /api/providers ---")
    response = client.get("/api/providers")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    providers = data.get("providers", [])
    print(f"Registered Providers: {[p['name'] + ' (model=' + p['model'] + ', available=' + str(p['available']) + ')' for p in providers]}")
    provider_ids = [p["id"] for p in providers]
    assert "openai" in provider_ids, "Expected 'openai' provider in list"
    assert "ollama" in provider_ids, "Expected 'ollama' provider in list"
    print("[PASS] AI Providers endpoint verified.")

def test_products_catalog():
    print("\n--- Testing GET /api/products ---")
    res = client.get("/api/products?limit=10")
    assert res.status_code == 200
    prods = res.json()
    assert len(prods) == 10
    print(f"Retrieved {len(prods)} products in catalog.")

    res_laptop = client.get("/api/products?category=laptop")
    assert res_laptop.status_code == 200
    laptops = res_laptop.json()
    assert len(laptops) == 15
    print(f"Retrieved {len(laptops)} laptops.")

    res_price = client.get("/api/products?category=laptop&max_price=80000")
    assert res_price.status_code == 200
    budget_laptops = res_price.json()
    for l in budget_laptops:
        assert l["price"] <= 80000
    print(f"Retrieved {len(budget_laptops)} laptops under 80k.")
    print("[PASS] Products catalog & filters verified.")

def test_single_product_and_similar():
    print("\n--- Testing GET /api/products/{id} and /similar ---")
    res = client.get("/api/products/lap_01")
    assert res.status_code == 200
    p = res.json()
    print(f"Product: {p['name']} (Price: ₹{p['price']:,.0f})")

    res_sim = client.get("/api/products/lap_01/similar?limit=3")
    assert res_sim.status_code == 200
    sim_list = res_sim.json()
    assert len(sim_list) == 3
    print("Top 3 Semantically Similar Products:")
    for sim in sim_list:
        print(f"  * {sim['product']['name']} - Similarity: {sim['similarity_score']}")
    print("[PASS] Single product & vector similarity verified.")

def test_chat_with_providers():
    print("\n--- Testing POST /api/chat with Dual AI Providers ---")
    
    # 1. Test with default/OpenAI provider
    payload_openai = {
        "message": "Find me a gaming laptop with high refresh rate under ₹1,20,000",
        "conversation_id": "test-session-openai",
        "provider": "openai"
    }
    res_1 = client.post("/api/chat", json=payload_openai)
    assert res_1.status_code == 200, f"Error: {res_1.text}"
    chat_1 = res_1.json()
    print(f"[OpenAI Chat] Provider Used: {chat_1.get('provider_used')}")
    print(f"[OpenAI Chat] Intent Category: {chat_1['intent']['category']}")
    print(f"[OpenAI Chat] Top Pick: {chat_1['products'][0]['product']['name']} ({chat_1['products'][0]['match_score']}% Match)")
    assert len(chat_1["products"]) > 0

    # 2. Test with Local AI / Ollama provider
    payload_ollama = {
        "message": "Best comfortable road running shoes under ₹8,000",
        "conversation_id": "test-session-ollama",
        "provider": "ollama"
    }
    res_2 = client.post("/api/chat", json=payload_ollama)
    assert res_2.status_code == 200, f"Error: {res_2.text}"
    chat_2 = res_2.json()
    print(f"[Ollama Chat] Provider Used: {chat_2.get('provider_used')}")
    print(f"[Ollama Chat] Intent Category: {chat_2['intent']['category']}")
    print(f"[Ollama Chat] Top Pick: {chat_2['products'][0]['product']['name']} ({chat_2['products'][0]['match_score']}% Match)")
    assert len(chat_2["products"]) > 0

    print("[PASS] Chat flow with dual AI providers verified.")

if __name__ == "__main__":
    print("Running Full Backend Verification Suite...")
    test_health()
    test_providers_endpoint()
    test_products_catalog()
    test_single_product_and_similar()
    test_chat_with_providers()
    print("\n[ALL TESTS PASSED SUCCESSFULLY!]")
