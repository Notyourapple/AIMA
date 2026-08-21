import os
import sys
import logging
from pathlib import Path

# Add project root and backend dir to sys.path so imports work from any working directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
for p in [str(PROJECT_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.utils.config import settings
from backend.api.chat import router as chat_router
from backend.api.products import router as products_router
from backend.vector.pinecone_client import vector_store

# Configure Logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Vector engine ready with {len(vector_store.get_all_products())} products loaded.")
    yield
    logger.info("Shutting down AI Marketplace Assistant API...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Autonomous Conversational Shopping Agent & Vector Recommendation Engine API",
    lifespan=lifespan
)

# CORS Configuration
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

# Include FRONTEND_URL if provided
frontend_url_env = os.getenv("FRONTEND_URL", "") or settings.FRONTEND_URL
if frontend_url_env:
    for url in frontend_url_env.split(","):
        clean_url = url.strip().rstrip("/")
        if clean_url and clean_url not in allowed_origins:
            allowed_origins.append(clean_url)

for origin in settings.CORS_ORIGINS:
    clean_origin = origin.strip().rstrip("/")
    if clean_origin and clean_origin not in allowed_origins:
        allowed_origins.append(clean_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(chat_router)
app.include_router(products_router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "pinecone_connected": vector_store.use_pinecone,
        "total_products": len(vector_store.get_all_products())
    }

@app.get("/", tags=["Root"])
def root_endpoint():
    return {
        "message": "AI Marketplace Assistant API is online.",
        "documentation": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", str(settings.PORT)))
    uvicorn.run("backend.main:app", host=settings.HOST, port=port, reload=settings.DEBUG)
