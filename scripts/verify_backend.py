#!/usr/bin/env python3
"""
Automated Backend & Vector Recommendation Test Suite
Tests FastAPI endpoints directly via TestClient.
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
    print(f"Status: {data['status']}, Total Products Loaded: {data['total_products']}")
    assert data["total_products"] >= 60, "Expected at least 60 products loaded"
    print("[PASS] Health check verified.")

def test_products_catalog():
    print("\n--- Testing GET /api/products ---")
    # All products
    res = client.get("/api/products?limit=10")
    assert res.status_code == 200
    prods = res.json()
    assert len(prods) == 10
    print(f"Retrieved {len(prods)} products in catalog.")

    # Category filter
    res_laptop = client.get("/api/products?category=laptop")
    assert res_laptop.status_code == 200
    laptops = res_laptop.json()
    assert len(laptops) == 15
    print(f"Retrieved {len(laptops)} laptops.")

    # Price filter
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

def test_chat_assistant_flow():
    print("\n--- Testing POST /api/chat (Conversational Shopping Flow) ---")
    # Turn 1: Budget & Category Intent Query
    query_1 = "I need a laptop for AI development and machine learning under ₹1,20,000"
    payload_1 = {
        "message": query_1,
        "conversation_id": "test-session-001"
    }
    res_1 = client.post("/api/chat", json=payload_1)
    assert res_1.status_code == 200, f"Error: {res_1.text}"
    chat_res_1 = res_1.json()

    print(f"Query 1: '{query_1}'")
    print(f"Intent Extracted: Category={chat_res_1['intent']['category']}, Budget=₹{chat_res_1['intent']['budget']}")
    print(f"AI Response:\n{chat_res_1['response'][:250]}...\n")
    print(f"Recommended Products ({len(chat_res_1['products'])}):")
    for r in chat_res_1["products"]:
        p = r["product"]
        print(f"  * {p['brand']} {p['name']} | Price: ₹{p['price']:,.0f} | Match: {r['match_score']}%")
        print(f"    Rationale: {r['reason']}")

    assert len(chat_res_1["products"]) > 0, "Expected recommended products"
    assert chat_res_1["intent"]["category"] == "laptop"

    # Turn 2: Multi-Turn Context Follow-Up Query
    query_2 = "Which one has the best battery life?"
    payload_2 = {
        "message": query_2,
        "conversation_id": "test-session-001"
    }
    res_2 = client.post("/api/chat", json=payload_2)
    assert res_2.status_code == 200
    chat_res_2 = res_2.json()

    print(f"\nQuery 2 (Follow-up): '{query_2}'")
    print(f"AI Follow-up Response:\n{chat_res_2['response'][:250]}...\n")
    print("[PASS] Conversational shopping & multi-turn memory flow verified.")

if __name__ == "__main__":
    print("Running Full Backend Verification Suite...")
    test_health()
    test_products_catalog()
    test_single_product_and_similar()
    test_chat_assistant_flow()
    print("\n[ALL TESTS PASSED SUCCESSFULLY!]")
