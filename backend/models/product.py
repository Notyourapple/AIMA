from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    price: float
    rating: float = Field(default=4.5, ge=0.0, le=5.0)
    rating_count: int = 0
    image_url: str
    description: str
    features: List[str] = []
    specifications: Dict[str, str] = {}
    best_for: List[str] = []

class Product(ProductBase):
    pass

class ProductFilter(BaseModel):
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    brand: Optional[str] = None
    query: Optional[str] = None
    limit: int = 50
    offset: int = 0

class SimilarProduct(BaseModel):
    product: Product
    similarity_score: float
    reason: Optional[str] = None
