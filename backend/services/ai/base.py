from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from backend.models.chat import UserIntent, RecommendedProduct

class BaseAIProvider(ABC):
    id: str
    name: str
    model_name: str
    description: str

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the provider is properly configured, running, and reachable."""
        pass

    @abstractmethod
    def extract_intent(
        self,
        message: str,
        history: List[Dict[str, str]],
        last_products: List[RecommendedProduct]
    ) -> UserIntent:
        """Extracts structured shopping intent from user message and past conversation context."""
        pass

    @abstractmethod
    def generate_response(
        self,
        message: str,
        intent: UserIntent,
        products: List[RecommendedProduct],
        history: List[Dict[str, str]]
    ) -> str:
        """Generates conversational, natural language shopping advisor response."""
        pass
