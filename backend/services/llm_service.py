import re
import json
import logging
from typing import Dict, Any, List, Optional
from backend.utils.config import settings
from backend.models.chat import UserIntent, RecommendedProduct

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self._openai_client = None
        self._quota_exhausted = False
        self._init_client()

    def _init_client(self):
        if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip() and not settings.OPENAI_API_KEY.startswith("sk-placeholder"):
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI LLM Client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize OpenAI LLM: {e}. Fallback intent extractor enabled.")
                self._openai_client = None
        else:
            logger.info("No OpenAI API key provided. Using built-in semantic vectorizer.")

    def extract_intent(self, message: str, history: List[Dict[str, str]], last_products: List[RecommendedProduct]) -> UserIntent:
        """Extracts structured intent from user message and past conversation context."""
        # 1. Try OpenAI structured extraction if available
        if self._openai_client and not self._quota_exhausted:
            try:
                system_prompt = (
                    "You are an expert AI e-commerce shopping agent. Analyze the user's message in the context of recent chat history.\n"
                    "Extract structured shopping intent:\n"
                    "- category: 'laptop', 'smartphone', 'headphones', 'shoes', or null\n"
                    "- budget: numeric maximum budget in INR (e.g. 120000), or null\n"
                    "- use_case: list of primary use cases (e.g. ['programming', 'machine learning', 'gaming', 'long runs'])\n"
                    "- preferences: list of specific hardware/feature preferences (e.g. ['good battery', 'RTX GPU', 'ANC', 'cushioned'])\n"
                    "- comparison_requested: true if asking to compare or asking which one is best among previously shown products\n"
                    "- follow_up: true if this is a follow-up query to the previous conversation\n"
                    "- extracted_query: a dense semantic search query summarizing user requirements\n"
                    "Return ONLY valid JSON matching this schema."
                )

                history_context = "\n".join([f"{h['role']}: {h['content']}" for h in history[-4:]])
                user_content = f"Recent History:\n{history_context}\n\nUser Message: {message}"

                response = self._openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                data = json.loads(response.choices[0].message.content)
                return UserIntent(**data)
            except Exception as e:
                err_str = str(e).lower()
                if "quota" in err_str or "429" in err_str:
                    self._quota_exhausted = True
                    logger.warning("OpenAI LLM quota exceeded. Switching to deterministic regex parser.")
                else:
                    logger.error(f"OpenAI intent extraction error: {e}. Using deterministic regex parser.")

        # 2. Resilient Rule-based / Regex NLP intent extractor
        return self._extract_intent_fallback(message, history, last_products)

    def _extract_intent_fallback(self, message: str, history: List[Dict[str, str]], last_products: List[RecommendedProduct]) -> UserIntent:
        msg_lower = message.lower()

        # Category detection with word boundary precision
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
            # Inherit category from last recommended product in multi-turn conversation
            category = last_products[0].product.category

        # Budget & Price Range extraction (INR)
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
        """
        Parses explicit price ranges ('between 20k and 30k'), target prices ('around 30000'),
        and price limits ('under 50k', 'above 40k').
        Returns (min_price, max_price, target_price, budget).
        """
        def parse_val(s: str) -> Optional[float]:
            s = s.strip().lower()
            # Check lakh
            lm = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)', s)
            if lm:
                return float(lm.group(1)) * 100000
            # Check k
            km = re.search(r'(\d+(?:\.\d+)?)\s*k\b', s)
            if km:
                return float(km.group(1)) * 1000
            # Clean commas and any non-digit chars (except dot)
            clean = s.replace(",", "")
            clean = re.sub(r'[^\d.]', '', clean)
            try:
                return float(clean) if clean else None
            except:
                return None

        # Pattern matching comma numbers first, then k/lakh, then standard numbers
        num_pat = r'(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d+)?\s*(?:k|lakh|lacs|lac)\b|\d{4,8}|\d{1,3})'

        # 1. Check Range: "between X and Y" or "from X to Y" or "X to Y" or "X - Y"
        range_match = re.search(rf'(?:between|from)?\s*₹?\s*{num_pat}\s*(?:and|to|-)\s*₹?\s*{num_pat}', text)
        if range_match:
            p1 = parse_val(range_match.group(1))
            p2 = parse_val(range_match.group(2))
            if p1 and p2:
                low, high = min(p1, p2), max(p1, p2)
                mid = (low + high) / 2
                return low, high, mid, high

        # 2. Check "around X" / "approx X" / "in X range" / "near X"
        around_match = re.search(rf'(?:around|approx|approximately|in the|near|about)\s*₹?\s*{num_pat}\s*(?:range|budget)?', text)
        if around_match:
            target = parse_val(around_match.group(1))
            if target and target > 0:
                low = target * 0.75
                high = target * 1.15
                return low, high, target, high

        # 3. Check "under X" / "below X" / "less than X" / "within X" / "budget X" / "₹X"
        under_match = re.search(rf'(?:under|below|less than|within|max|budget|up to|₹|rs\.?|inr)\s*₹?\s*{num_pat}', text)
        if under_match:
            high = parse_val(under_match.group(1))
            if high and high > 0:
                if high >= 60000:
                    low = high * 0.60
                elif high >= 25000:
                    low = high * 0.55
                elif high >= 15000:
                    low = high * 0.50
                else:
                    low = 0.0
                return low, high, high * 0.85, high

        # 4. Check "above X" / "more than X" / "starting from X"
        above_match = re.search(rf'(?:above|over|more than|greater than|starting from)\s*₹?\s*{num_pat}', text)
        if above_match:
            low = parse_val(above_match.group(1))
            if low and low > 0:
                return low, None, low * 1.25, None

        # 5. Generic standalone price (e.g. "phones 20000" or "laptop 1.2 lakh")
        gen_match = re.search(rf'{num_pat}', text)
        if gen_match:
            val = parse_val(gen_match.group(1))
            if val and val >= 1000:
                low = val * 0.70
                high = val * 1.20
                return low, high, val, high

        return None, None, None, None

    def generate_conversational_response(
        self,
        message: str,
        intent: UserIntent,
        products: List[RecommendedProduct],
        history: List[Dict[str, str]]
    ) -> str:
        """Generates a natural, intelligent conversational response."""
        # 1. Use OpenAI GPT-4o-mini if configured
        if self._openai_client and not self._quota_exhausted and products:
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
                    "You are a sophisticated, friendly, and expert AI Shopping Advisor and Systems Architect.\n"
                    "The user is asking for product advice. You have retrieved candidate products from a vector database.\n"
                    "Write a concise, polished response in conversational markdown:\n"
                    "1. Acknowledge what the user needs (budget, category, key use-cases).\n"
                    "2. Highlight how the top retrieved options uniquely cater to their constraints (e.g. compare strengths like GPU power, battery life, cushioning, or ANC).\n"
                    "3. Keep the tone warm, concise, and helpful. Do not duplicate all product card data, as visual cards will be rendered directly in the UI.\n"
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

                response = self._openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=400
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                err_str = str(e).lower()
                if "quota" in err_str or "429" in err_str:
                    self._quota_exhausted = True
                    logger.warning("OpenAI chat quota exceeded. Switching to deterministic conversational synthesizer.")
                else:
                    logger.error(f"OpenAI response generation error: {e}. Falling back to template generation.")

        # 2. Resilient Fallback generator
        return self._generate_fallback_response(message, intent, products)

    def _generate_fallback_response(self, message: str, intent: UserIntent, products: List[RecommendedProduct]) -> str:
        if not products:
            return (
                f"I couldn't find an exact match for your request. "
                f"Try adjusting your budget or exploring related categories like Laptops, Smartphones, Headphones, or Running Shoes."
            )

        top_p = products[0].product
        top_name = self._clean_product_name(top_p.brand, top_p.name)
        
        budget_str = f" under **₹{intent.budget:,.0f}**" if intent.budget else ""
        use_case_str = f" for **{', '.join(intent.use_case)}**" if intent.use_case else ""

        # Check if top pick fits the budget
        all_over_budget = intent.budget and all(p.product.price > intent.budget for p in products)
        
        summary_lines = []
        if all_over_budget:
            lowest_price = min(p.product.price for p in products)
            summary_lines.append(
                f"We currently don't have products strictly under **₹{intent.budget:,.0f}** in our catalog (closest options start from **₹{lowest_price:,.0f}**). Here are the closest high-value alternatives:"
            )
        else:
            summary_lines.append(
                f"Based on your requirements{budget_str}{use_case_str}, I analyzed our vector product catalog and found **{len(products)} high-match recommendations**:"
            )

        summary_lines.append("")
        summary_lines.append(f"• **Top Pick — {top_name}** ({products[0].match_score}% Match): {products[0].reason}")

        if len(products) > 1:
            second = products[1].product
            second_name = self._clean_product_name(second.brand, second.name)
            summary_lines.append(f"• **Alternative — {second_name}** ({products[1].match_score}% Match): {products[1].reason}")

        if len(products) > 2:
            third = products[2].product
            third_name = self._clean_product_name(third.brand, third.name)
            summary_lines.append(f"• **Value Contender — {third_name}** ({products[2].match_score}% Match): {products[2].reason}")

        summary_lines.append("")
        summary_lines.append("Feel free to ask me to compare their specs, check battery life, or narrow down specific features!")

        return "\n".join(summary_lines)

    @staticmethod
    def _clean_product_name(brand: str, name: str) -> str:
        if name.lower().startswith(brand.lower()):
            return name
        return f"{brand} {name}"

llm_service = LLMService()
