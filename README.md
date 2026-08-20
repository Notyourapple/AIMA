# AI Marketplace Assistant (AIMA)

> **Autonomous Conversational Shopping Agent & Vector Recommendation Engine**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-000000?style=flat)](https://www.pinecone.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-text--embedding--3--small-412991?style=flat&logo=openai)](https://openai.com/)
[![LangChain](https://img.shields.io/badge/LangChain-Orchestration-white?style=flat)](https://www.langchain.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

---

## 1. Problem Statement

Traditional e-commerce search relies almost entirely on rigid keyword matching and categorical filter clicking.

When a customer searches:
> *"I need comfortable running shoes under ₹8,000 for daily road use and occasional long-distance runs."*

Legacy search engines simply match the keywords `running`, `shoes`, and `₹8,000`, returning generic or poorly matched inventory without understanding **cushioning needs**, **heel drop**, **use case**, or **semantic context**.

---

## 2. Solution Overview

**AI Marketplace Assistant (AIMA)** replaces brittle keywords with a multi-factor vector recommendation agent:

1. **Structured Intent Extraction**: Parses the user's natural language into domain parameters (Category, Budget ceiling in INR, Use Cases, Preferred features).
2. **Dense Vector Search**: Converts product specifications into semantic embedding documents and executes approximate nearest neighbor (ANN) search over **Pinecone Vector Database**.
3. **Hybrid Recommendation Engine**:
   $$\text{Final Score} = 0.50 \times \text{Semantic Similarity} + 0.20 \times \text{Budget Fit} + 0.20 \times \text{Preference Match} + 0.10 \times \text{Product Rating}$$
4. **Context-Aware Conversational Synthesis**: Generates rich natural language explanations, highlighting why each product matches user criteria.
5. **Multi-Turn Session Memory**: Supports natural follow-up queries (e.g., *"Which of these has the best battery life?"* or *"Compare their processors"*).

---

## 3. System Architecture

```
User Query (Natural Language)
            ↓
Next.js 14 Frontend (App Router, Tailwind CSS, Framer Motion)
            ↓ REST API (/api/chat)
FastAPI Async Backend
            ↓
LangChain Shopping Agent (Structured Intent Extraction)
            ↓
OpenAI Embeddings (text-embedding-3-small)
            ↓
Pinecone Vector Database (Cosine Similarity Search)
            ↓
Hybrid Multi-Factor Scoring Engine
            ↓
LLM Context Synthesis (OpenAI GPT-4o-mini / LangChain with Session Memory)
            ↓
Structured Response (Conversational Explanation + Product Cards + Match %)
```

---

## 4. Monorepo Project Structure

```text
ai-marketplace-assistant/
├── frontend/                     # Next.js App Router Frontend
│   ├── app/                      # Routes: /, /chat, /products, /products/[id], /saved
│   ├── components/               # UI, Chat, Product & Landing components
│   │   ├── chat/                 # ChatWindow, ChatMessage, ChatInput, TypingIndicator
│   │   ├── products/             # ProductCard, ProductGrid, ProductDetails
│   │   ├── landing/              # Hero, Features, HowItWorks
│   │   ├── layout/               # Navbar, Sidebar
│   │   └── ui/                   # Button, Card, Badge, Input
│   ├── lib/                      # api.ts client, store.tsx context, utils.ts
│   └── types/                    # TypeScript interfaces
│
├── backend/                      # FastAPI Python Backend
│   ├── main.py                   # FastAPI app entrypoint
│   ├── api/                      # REST routers (chat.py, products.py)
│   ├── services/                 # llm_service.py, embedding_service.py, recommendation_service.py
│   ├── agents/                   # shopping_agent.py, memory.py
│   ├── vector/                   # pinecone_client.py
│   ├── models/                   # product.py, chat.py Pydantic schemas
│   ├── utils/                    # config.py
│   └── requirements.txt
│
├── scripts/
│   └── ingest_products.py        # Pinecone batch vector ingestion script
│
├── data/
│   └── products.json             # 60+ curated products (Laptops, Phones, Audio, Shoes)
│
├── .env.example
└── README.md
```

---

## 5. Quickstart Guide

### Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.10+

### Step 1: Environment Configuration
Copy `.env.example` to `.env` in project root (or export env variables):
```bash
cp .env.example .env
```

Set your API keys (optional — if keys are not provided, built-in high-speed local vector and NLP fallbacks will seamlessly operate):
```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk-...
PINECONE_INDEX_NAME=ai-marketplace-products
PINECONE_ENVIRONMENT=us-east-1
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Step 2: Start the Backend (FastAPI)

**Option A (From inside `backend/` directory):**
```bash
cd backend
uvicorn main:app --reload --port 8000
```
*(Or simply run `python main.py`)*

**Option B (From project root `AIMA/`):**
```bash
uvicorn backend.main:app --reload --port 8000
```
API Documentation and interactive Swagger UI will be available at: `http://localhost:8000/docs`

---

### Step 3: Ingest Products to Pinecone (Optional if using Pinecone)

To batch embed all 60+ products and upload vectors to your Pinecone index:
```bash
python scripts/ingest_products.py
```
To run a dry run without making remote API calls:
```bash
python scripts/ingest_products.py --dry-run
```

---

### Step 4: Start the Frontend (Next.js)

**From project root:**
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Key REST API Endpoints

### 1. `POST /api/chat`
**Request Body:**
```json
{
  "message": "I need a gaming laptop under ₹1,20,000 for AI development and gaming",
  "conversation_id": "session-123"
}
```
**Response:**
```json
{
  "conversation_id": "session-123",
  "response": "Based on your requirements under ₹1,20,000...",
  "products": [
    {
      "product": {
        "id": "lap_01",
        "name": "Lenovo Legion Pro 5 Gen 9",
        "brand": "Lenovo",
        "price": 109999,
        "rating": 4.7
      },
      "match_score": 96,
      "reason": "Fits within your ₹1,20,000 budget with ₹10,001 to spare. Optimized for Gaming, Machine Learning."
    }
  ],
  "suggested_followups": [
    "Which one has the best battery life?",
    "Which laptop is best for machine learning?"
  ]
}
```

### 2. `GET /api/products`
Fetch product catalog with filtering:
`GET /api/products?category=laptop&max_price=100000`

### 3. `GET /api/products/{id}/similar`
Retrieve top $k$ semantically similar products computed via vector embeddings:
`GET /api/products/lap_01/similar?limit=4`

---

## 7. Sample Queries to Test

- *"Best gaming laptop under ₹1 lakh with good RTX GPU"*
- Follow-up: *"Which one has the best battery life?"*
- *"Comfortable running shoes for beginners under ₹8,000"*
- *"Noise cancelling headphones with LDAC audio and long battery life"*
- *"Best smartphone for photography and zoom under ₹60,000"*

---

## 8. License
MIT License. Built for production demonstration and portfolio.
