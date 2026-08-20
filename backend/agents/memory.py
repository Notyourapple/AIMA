import time
from typing import Dict, List, Optional, Any
from backend.models.chat import MessageHistoryItem, RecommendedProduct

class ConversationSession:
    def __init__(self, conversation_id: str):
        self.conversation_id = conversation_id
        self.messages: List[MessageHistoryItem] = []
        self.last_recommended_products: List[RecommendedProduct] = []
        self.last_intent: Optional[Any] = None
        self.created_at: float = time.time()
        self.updated_at: float = time.time()

    def add_user_message(self, content: str):
        self.messages.append(MessageHistoryItem(
            role="user",
            content=content,
            timestamp=str(time.time())
        ))
        self.updated_at = time.time()

    def add_assistant_message(self, content: str, products: Optional[List[RecommendedProduct]] = None):
        prod_dicts = [p.dict() for p in products] if products else []
        self.messages.append(MessageHistoryItem(
            role="assistant",
            content=content,
            products=prod_dicts,
            timestamp=str(time.time())
        ))
        if products:
            self.last_recommended_products = products
        self.updated_at = time.time()

    def get_history_summary(self, max_messages: int = 6) -> List[Dict[str, str]]:
        recent = self.messages[-max_messages:]
        return [{"role": m.role, "content": m.content} for m in recent]

class SessionMemoryManager:
    def __init__(self):
        self._sessions: Dict[str, ConversationSession] = {}

    def get_or_create_session(self, conversation_id: str) -> ConversationSession:
        if conversation_id not in self._sessions:
            self._sessions[conversation_id] = ConversationSession(conversation_id)
        return self._sessions[conversation_id]

    def get_session(self, conversation_id: str) -> Optional[ConversationSession]:
        return self._sessions.get(conversation_id)

    def clear_session(self, conversation_id: str):
        if conversation_id in self._sessions:
            del self._sessions[conversation_id]

memory_manager = SessionMemoryManager()
