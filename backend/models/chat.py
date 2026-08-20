from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from backend.models.product import Product

class UserIntent(BaseModel):
    category: Optional[str] = Field(default=None, description="Primary product category (laptop, smartphone, headphones, shoes)")
    budget: Optional[float] = Field(default=None, description="Maximum budget expressed in INR (e.g. 100000)")
    min_price: Optional[float] = Field(default=None, description="Minimum price threshold in INR")
    max_price: Optional[float] = Field(default=None, description="Maximum price threshold in INR")
    target_price: Optional[float] = Field(default=None, description="Exact target or midpoint price in INR (e.g. 30000 for 'around 30k')")
    currency: str = "INR"
    use_case: List[str] = Field(default_factory=list, description="Specific use cases like 'machine learning', 'gaming', 'long runs'")
    preferences: List[str] = Field(default_factory=list, description="Key features or preferences like 'good battery', 'RTX GPU', 'OLED display'")
    comparison_requested: bool = False
    follow_up: bool = False
    extracted_query: str = Field(default="", description="Refined semantic search query")

class RecommendedProduct(BaseModel):
    product: Product
    match_score: int = Field(ge=0, le=100, description="Match percentage score from 0 to 100")
    reason: str = Field(description="AI-generated reason for why this product matches user query")
    score_breakdown: Optional[Dict[str, float]] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's natural language shopping query or follow-up")
    conversation_id: Optional[str] = Field(default=None, description="Unique conversation session UUID")

class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    products: List[RecommendedProduct] = []
    intent: Optional[UserIntent] = None
    suggested_followups: List[str] = []

class MessageHistoryItem(BaseModel):
    role: str # "user" or "assistant"
    content: str
    products: Optional[List[Dict[str, Any]]] = None
    timestamp: Optional[str] = None
