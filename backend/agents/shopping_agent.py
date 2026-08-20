import uuid
import logging
from typing import Dict, Any, List, Optional
from backend.models.chat import ChatRequest, ChatResponse, UserIntent, RecommendedProduct
from backend.agents.memory import memory_manager
from backend.services.llm_service import llm_service
from backend.services.embedding_service import embedding_service
from backend.services.recommendation_service import recommendation_service
from backend.vector.pinecone_client import vector_store

logger = logging.getLogger(__name__)

class ShoppingAgent:
    def process_message(self, request: ChatRequest) -> ChatResponse:
        conversation_id = request.conversation_id or str(uuid.uuid4())
        session = memory_manager.get_or_create_session(conversation_id)

        # 1. Add incoming user message to session
        session.add_user_message(request.message)
        history = session.get_history_summary(max_messages=6)

        # 2. Extract structured shopping intent
        intent = llm_service.extract_intent(
            message=request.message,
            history=history,
            last_products=session.last_recommended_products
        )
        session.last_intent = intent

        # 3. Handle comparison or follow-up on existing recommendations
        if intent.comparison_requested and session.last_recommended_products:
            # Rerank or focus on existing products with query context
            candidates = [
                {"id": rp.product.id, "score": float(rp.match_score) / 100.0, "metadata": {}}
                for rp in session.last_recommended_products
            ]
            ranked_products = session.last_recommended_products
        else:
            # 4. Generate dense embedding query
            query_text = self._build_semantic_query(request.message, intent)
            query_vector = embedding_service.get_embedding(query_text)

            # 5. Query Vector Database (Pinecone / In-memory) with price range filters
            candidates = vector_store.query_vectors(
                query_vector=query_vector,
                top_k=10,
                category=intent.category,
                min_price=intent.min_price,
                max_price=intent.max_price or intent.budget,
                target_price=intent.target_price
            )

            # 6. Apply Hybrid Multi-Factor Recommendation Ranking
            all_products_map = {p.id: p for p in vector_store.get_all_products()}
            ranked_products = recommendation_service.rank_products(
                candidates=candidates,
                intent=intent,
                products_map=all_products_map,
                limit=4
            )

        # 7. Generate contextual natural language response
        response_text = llm_service.generate_conversational_response(
            message=request.message,
            intent=intent,
            products=ranked_products,
            history=history
        )

        # 8. Generate dynamic suggested follow-ups
        suggested_followups = self._generate_suggested_followups(intent, ranked_products)

        # 9. Save assistant response to session memory
        session.add_assistant_message(response_text, ranked_products)

        return ChatResponse(
            conversation_id=conversation_id,
            response=response_text,
            products=ranked_products,
            intent=intent,
            suggested_followups=suggested_followups
        )

    def _build_semantic_query(self, user_msg: str, intent: UserIntent) -> str:
        """Constructs an enriched semantic search query."""
        parts = [user_msg]
        if intent.category:
            parts.append(f"Category: {intent.category}")
        if intent.use_case:
            parts.append(f"Use case: {', '.join(intent.use_case)}")
        if intent.preferences:
            parts.append(f"Preferences: {', '.join(intent.preferences)}")
        return " | ".join(parts)

    def _generate_suggested_followups(self, intent: UserIntent, products: List[RecommendedProduct]) -> List[str]:
        suggestions = []
        if not products:
            return [
                "Laptops for programming under ₹1,20,000",
                "Best noise cancelling headphones",
                "Comfortable marathon running shoes",
                "Flagship smartphones under ₹70,000"
            ]

        top_p = products[0].product
        category = top_p.category.lower()

        if category == "laptop":
            suggestions.append("Which one has the best battery life?")
            suggestions.append("Which laptop is best for machine learning?")
            suggestions.append("Show me lightweight options under 1.5kg")
        elif category == "smartphone":
            suggestions.append("Which phone has the best camera and zoom?")
            suggestions.append("Which one has the fastest charging?")
            suggestions.append("Compare battery capacity and display specs")
        elif category == "headphones":
            suggestions.append("Which one has the best active noise cancellation?")
            suggestions.append("Which is most comfortable for long flights?")
            suggestions.append("Compare sound quality and codecs")
        elif category == "shoes":
            suggestions.append("Which shoe has maximum cushioning for knee pain?")
            suggestions.append("Which is best for marathon race day?")
            suggestions.append("Show me options with high wet grip")
        else:
            suggestions.append("Compare top 2 choices")
            suggestions.append("Show options with longer battery life")
            suggestions.append("What are the key differences?")

        return suggestions[:4]

shopping_agent = ShoppingAgent()
