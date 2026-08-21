import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "AI Marketplace Assistant API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = "0.0.0.0"
    
    # CORS & Frontend Origins
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    
    # OpenAI Settings
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536
    
    # Pinecone Settings
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "ai-marketplace-products"
    PINECONE_ENVIRONMENT: str = "us-east-1"
    
    # Data Paths
    PRODUCTS_FILE_PATH: str = str(DATA_DIR / "products.json")

    class Config:
        env_file = [
            str(BASE_DIR / ".env"),
            str(PROJECT_ROOT / ".env"),
            ".env"
        ]
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
