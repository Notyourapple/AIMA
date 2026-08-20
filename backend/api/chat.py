import logging
from fastapi import APIRouter, HTTPException
from backend.models.chat import ChatRequest, ChatResponse
from backend.agents.shopping_agent import shopping_agent
from backend.agents.memory import memory_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """
    Core conversational shopping endpoint:
    - Extracts structured shopping intent
    - Embeds query and searches Pinecone vector DB
    - Ranks products using hybrid formula
    - Synthesizes natural conversational response
    """
    try:
        response = shopping_agent.process_message(request)
        return response
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your shopping query: {str(e)}"
        )

@router.get("/history/{conversation_id}")
def get_chat_history(conversation_id: str):
    """Retrieve full conversation history for a session."""
    session = memory_manager.get_session(conversation_id)
    if not session:
        return {"conversation_id": conversation_id, "messages": []}
    return {
        "conversation_id": conversation_id,
        "messages": [m.dict() for m in session.messages]
    }

@router.delete("/history/{conversation_id}")
def clear_chat_history(conversation_id: str):
    """Clear conversation history for a session."""
    memory_manager.clear_session(conversation_id)
    return {"status": "cleared", "conversation_id": conversation_id}
