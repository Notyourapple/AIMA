import re
import json
import time
import logging
import httpx
from typing import List, Dict, Any, Optional
from backend.utils.config import settings
from backend.models.chat import UserIntent, RecommendedProduct
from backend.services.ai.base import BaseAIProvider

logger = logging.getLogger(__name__)

class OllamaProvider(BaseAIProvider):
    id: str = "ollama"
    name: str = "Local AI"
    model_name: str = settings.OLLAMA_MODEL
    description: str = f"Local AI ({settings.OLLAMA_MODEL})"

    def __init__(self):
        self.host = settings.OLLAMA_HOST.rstrip("/")
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS
        self._last_health_check_time = 0.0
        self._cached_available = False

    def is_available(self) -> bool:
        """
        Checks if Ollama daemon is reachable and the model exists or is reachable.
        Cached for 5 seconds to prevent spamming the Ollama socket.
        """
        if not settings.OLLAMA_ENABLED:
            return False

        now = time.time()
        if now - self._last_health_check_time < 5.0:
            return self._cached_available

        self._last_health_check_time = now
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{self.host}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name", "") for m in data.get("models", [])]
                    # Model available if matching model_name prefix
                    model_found = any(self.model_name in m for m in models)
                    self._cached_available = True  # Ollama itself is reachable
                    return True
                self._cached_available = False
                return False
        except Exception as e:
            logger.debug(f"Ollama health check failed: {e}")
            self._cached_available = False
            return False

    def extract_intent(
        self,
        message: str,
        history: List[Dict[str, str]],
        last_products: List[RecommendedProduct]
    ) -> UserIntent:
        """Extract shopping intent using local Qwen 2.5 3B."""
        if self.is_available():
            try:
                system_prompt = (
                    "You are an expert e-commerce shopping intent parser.\n"
                    "Analyze the user's message and recent chat history. Return ONLY a valid JSON object with the following fields:\n"
                    "{\n"
                    '  "category": "laptop" | "smartphone" | "headphones" | "shoes" | null,\n'
                    '  "budget": number (maximum budget in INR) | null,\n'
                    '  "min_price": number | null,\n'
                    '  "max_price": number | null,\n'
                    '  "target_price": number | null,\n'
                    '  "currency": "INR",\n'
                    '  "use_case": ["string"],\n'
                    '  "preferences": ["string"],\n'
                    '  "comparison_requested": boolean,\n'
                    '  "follow_up": boolean,\n'
                    '  "extracted_query": "string"\n'
                    "}"
                )

                history_context = "\n".join([f"{h['role']}: {h['content']}" for h in history[-4:]])
                user_content = f"Recent History:\n{history_context}\n\nUser Message: {message}"

                payload = {
                    "model": self.model_name,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    "format": "json",
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 300
                    }
                }

                with httpx.Client(timeout=self.timeout) as client:
                    response = client.post(f"{self.host}/api/chat", json=payload)
                    if response.status_code == 200:
                        res_json = response.json()
                        content_str = res_json.get("message", {}).get("content", "")
                        data = json.loads(content_str)
                        return UserIntent(**data)
                    else:
                        logger.warning(f"Ollama returned HTTP {response.status_code} during intent extraction.")
            except Exception as e:
                logger.warning(f"Ollama intent extraction failed: {e}. Using deterministic regex parser.")

        return self._extract_intent_fallback(message, history, last_products)

    def generate_response(
        self,
        message: str,
        intent: UserIntent,
        products: List[RecommendedProduct],
        history: List[Dict[str, str]]
    ) -> str:
        """Generate conversational recommendations using local Qwen 2.5 3B."""
        if self.is_available() and products:
            try:
                prod_context = []
                for idx, rp in enumerate(products, 1):
                    p = rp.product
                    prod_context.append(
                        f"[{idx}] {self._clean_product_name(p.brand, p.name)} - Price: ₹{p.price:,.0f}, Rating: {p.rating}★\n"
                        f"    Key Features: {', '.join(p.features[:3])}\n"
                        f"    Best For: {', '.join(p.best_for)}\n"
                        f"    Match Score: {rp.match_score}%\n"
                        f"    AI Match Rationale: {rp.reason}"
                    )
                context_str = "\n".join(prod_context)

                system_prompt = (
                    "You are a sophisticated, friendly, and expert AI Shopping Advisor.\n"
                    "The user is asking for product advice. You have retrieved candidate products from a vector database.\n"
                    "Write a concise, polished response in conversational markdown:\n"
                    "1. Acknowledge what the user needs (budget, category, key use-cases).\n"
                    "2. Highlight how the top retrieved options uniquely cater to their constraints (e.g. compare strengths like GPU power, battery life, cushioning, or ANC).\n"
                    "3. Keep the tone warm, concise, and helpful. Do not duplicate all product card data.\n"
                    "4. Add a quick closing tip or follow-up question."
                )

                history_msgs = [{"role": h["role"], "content": h["content"]} for h in history[-4:]]
                messages = [
                    {"role": "system", "content": system_prompt},
                    *history_msgs,
                    {
                        "role": "user",
                        "content": f"User Query: {message}\n\nRetrieved Product Candidates:\n{context_str}"
                    }
                ]

                payload = {
                    "model": self.model_name,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 450
                    }
                }

                with httpx.Client(timeout=self.timeout) as client:
                    response = client.post(f"{self.host}/api/chat", json=payload)
                    if response.status_code == 200:
                        res_json = response.json()
                        content_str = res_json.get("message", {}).get("content", "").strip()
                        if content_str:
                            return content_str
                    else:
                        logger.warning(f"Ollama returned HTTP {response.status_code} during response generation.")
            except Exception as e:
                logger.warning(f"Ollama response generation failed: {e}. Falling back to template generation.")

        return self._generate_fallback_response(message, intent, products)

    def _extract_intent_fallback(self, message: str, history: List[Dict[str, str]], last_products: List[RecommendedProduct]) -> UserIntent:
        msg_lower = message.lower()

        # Category detection
        category = None
        if re.search(r'\b(headphone|headphones|earphone|earphones|earbud|earbuds|audio|airpods|headset|tws)\b', msg_lower):
            category = "headphones"
        elif re.search(r'\b(laptop|laptops|macbook|macbooks|pc|notebook|notebooks|thinkpad|legion|zephyrus)\b', msg_lower):
            category = "laptop"
        elif re.search(r'\b(phone|phones|smartphone|smartphones|iphone|iphones|galaxy|pixel|pixels|oneplus|mobile|mobiles)\b', msg_lower):
            category = "smartphone"
        elif re.search(r'\b(shoe|shoes|sneaker|sneakers|running|jogging|marathon|trainer|trainers)\b', msg_lower):
            category = "shoes"
        elif last_products:
            category = last_products[0].product.category

        # Budget parsing
        min_price, max_price, target_price, budget = self._parse_price_filters(msg_lower)

        # Use cases
        use_cases = []
        use_case_map = {
            "programming": ["programming", "coding", "software", "developer", "development", "python", "full-stack", "web dev"],
            "machine learning": ["ai", "machine learning", "deep learning", "data science", "llm", "neural network"],
            "gaming": ["gaming", "esports", "fps", "rtx", "gpu", "aaa games", "bgmi"],
            "photography": ["camera", "photography", "photos", "zoom", "portrait", "video", "cinematic", "reels"],
            "long distance running": ["long distance", "marathon", "half marathon", "daily runs", "jogging", "mileage"],
            "comfort & cushioning": ["comfortable", "cushion", "soft", "knee pain", "plantar", "standing all day"],
            "active noise cancellation": ["noise cancelling", "anc", "travel", "flight", "office focus", "quiet"],
            "long battery life": ["battery life", "battery", "all day", "long lasting"]
        }

        for uc_name, keywords in use_case_map.items():
            if any(k in msg_lower for k in keywords):
                use_cases.append(uc_name)

        # Preferences
        preferences = []
        if "battery" in msg_lower:
            preferences.append("good battery life")
        if "lightweight" in msg_lower or "portable" in msg_lower:
            preferences.append("lightweight & portable")
        if "gpu" in msg_lower or "graphics" in msg_lower or "rtx" in msg_lower:
            preferences.append("dedicated GPU")
        if "oled" in msg_lower or "display" in msg_lower or "screen" in msg_lower:
            preferences.append("vibrant high-resolution display")
        if "bass" in msg_lower:
            preferences.append("strong deep bass")
        if "fast charging" in msg_lower or "charging" in msg_lower:
            preferences.append("fast charging")

        is_comparison = any(w in msg_lower for w in ["which one", "compare", "difference", "versus", "vs", "better", "best of these", "battery"])
        is_followup = bool(last_products and (is_comparison or len(msg_lower.split()) < 7 or "which" in msg_lower or "one" in msg_lower))

        return UserIntent(
            category=category,
            budget=budget,
            min_price=min_price,
            max_price=max_price,
            target_price=target_price,
            currency="INR",
            use_case=use_cases,
            preferences=preferences,
            comparison_requested=is_comparison,
            follow_up=is_followup,
            extracted_query=message
        )

    def _parse_price_filters(self, text: str):
        def parse_val(s: str) -> Optional[float]:
            s = s.strip().lower()
            lm = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)', s)
            if lm:
                return float(lm.group(1)) * 100000
            km = re.search(r'(\d+(?:\.\d+)?)\s*k\b', s)
            if km:
                return float(km.group(1)) * 1000
            clean = s.replace(",", "")
            clean = re.sub(r'[^\d.]', '', clean)
            try:
                return float(clean) if clean else None
            except:
                return None

        num_pat = r'(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d+)?\s*(?:k|lakh|lacs|lac)\b|\d{4,8}|\d{1,3})'

        # 1. Range
        range_match = re.search(rf'(?:between|from)?\s*₹?\s*{num_pat}\s*(?:and|to|-)\s*₹?\s*{num_pat}', text)
        if range_match:
            p1 = parse_val(range_match.group(1))
            p2 = parse_val(range_match.group(2))
            if p1 and p2:
                low, high = min(p1, p2), max(p1, p2)
                mid = (low + high) / 2
                return low, high, mid, high

        # 2. Target/Around
        around_match = re.search(rf'(?:around|approx|approximately|in the|near|about)\s*₹?\s*{num_pat}\s*(?:range|budget)?', text)
        if around_match:
            target = parse_val(around_match.group(1))
            if target and target > 0:
                return target * 0.75, target * 1.15, target, target * 1.15

        # 3. Under/Budget
        under_match = re.search(rf'(?:under|below|less than|within|max|budget|up to|₹|rs\.?|inr)\s*₹?\s*{num_pat}', text)
        if under_match:
            high = parse_val(under_match.group(1))
            if high and high > 0:
                low = high * 0.60 if high >= 60000 else (high * 0.50 if high >= 15000 else 0.0)
                return low, high, high * 0.85, high

        # 4. Above
        above_match = re.search(rf'(?:above|over|more than|greater than|starting from)\s*₹?\s*{num_pat}', text)
        if above_match:
            low = parse_val(above_match.group(1))
            if low and low > 0:
                return low, None, low * 1.25, None

        # 5. Generic
        gen_match = re.search(rf'{num_pat}', text)
        if gen_match:
            val = parse_val(gen_match.group(1))
            if val and val >= 1000:
                return val * 0.70, val * 1.20, val, val * 1.20

        return None, None, None, None

    def _generate_fallback_response(self, message: str, intent: UserIntent, products: List[RecommendedProduct]) -> str:
        if not products:
            return "I couldn't find an exact match for your request. Try adjusting your budget or exploring other categories."

        top_p = products[0].product
        top_name = self._clean_product_name(top_p.brand, top_p.name)
        budget_str = f" under **₹{intent.budget:,.0f}**" if intent.budget else ""
        use_case_str = f" for **{', '.join(intent.use_case)}**" if intent.use_case else ""

        summary_lines = [
            f"Based on your requirements{budget_str}{use_case_str}, here are **{len(products)} top-rated recommendations** (processed via Local AI):",
            "",
            f"• **Top Pick — {top_name}** ({products[0].match_score}% Match): {products[0].reason}"
        ]

        if len(products) > 1:
            summary_lines.append(f"• **Alternative — {self._clean_product_name(products[1].product.brand, products[1].product.name)}** ({products[1].match_score}% Match): {products[1].reason}")
        if len(products) > 2:
            summary_lines.append(f"• **Value Contender — {self._clean_product_name(products[2].product.brand, products[2].product.name)}** ({products[2].match_score}% Match): {products[2].reason}")

        summary_lines.append("")
        summary_lines.append("Feel free to ask me to compare specs or examine specific features!")
        return "\n".join(summary_lines)

    @staticmethod
    def _clean_product_name(brand: str, name: str) -> str:
        if name.lower().startswith(brand.lower()):
            return name
        return f"{brand} {name}"
