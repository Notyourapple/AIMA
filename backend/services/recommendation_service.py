import logging
from typing import List, Dict, Any, Optional
from backend.models.product import Product
from backend.models.chat import UserIntent, RecommendedProduct

logger = logging.getLogger(__name__)

class RecommendationService:
    def rank_products(
        self,
        candidates: List[Dict[str, Any]],
        intent: UserIntent,
        products_map: Dict[str, Product],
        limit: int = 5
    ) -> List[RecommendedProduct]:
        """
        Applies hybrid scoring formula:
        Final Score = (Semantic Similarity * 0.50) +
                      (Budget Match * 0.20) +
                      (Preference Match * 0.20) +
                      (Product Rating * 0.10)
        """
        scored_products: List[RecommendedProduct] = []

        for candidate in candidates:
            pid = candidate["id"]
            product = products_map.get(pid)
            if not product:
                continue

            raw_similarity = float(candidate.get("score", 0.0))
            # Normalize cosine similarity
            similarity_norm = max(0.4, min(1.0, raw_similarity * 1.5)) if raw_similarity > 0 else 0.6

            # 1. Price Alignment Score (0.0 to 1.0)
            price_score = 0.90
            target = intent.target_price or (
                ((intent.min_price + intent.max_price) / 2) if (intent.min_price and intent.max_price)
                else intent.budget
            )
            
            if intent.min_price is not None and intent.max_price is not None:
                if intent.min_price * 0.95 <= product.price <= intent.max_price * 1.05:
                    # Direct hit inside user's requested range
                    price_score = 1.0
                elif product.price < intent.min_price:
                    # Below requested floor (too cheap)
                    diff = intent.min_price - product.price
                    price_score = max(0.1, 1.0 - (diff / max(1.0, intent.min_price * 0.5)))
                else:
                    # Above requested ceiling (too costly)
                    diff = product.price - intent.max_price
                    price_score = max(0.0, 1.0 - (diff / max(1.0, intent.max_price * 0.3)))
            elif target and target > 0:
                # Proximity to target / 'around' price
                diff = abs(product.price - target)
                tolerance = target * 0.35
                price_score = max(0.1, 1.0 - (diff / max(1.0, tolerance)))
            elif intent.budget and intent.budget > 0:
                if product.price <= intent.budget:
                    ratio = product.price / intent.budget
                    price_score = 0.80 + (0.20 * ratio)
                else:
                    over_ratio = (product.price - intent.budget) / intent.budget
                    price_score = max(0.0, 1.0 - (over_ratio * 3.0))

            # 2. Preference & Use-case Score (0.0 to 1.0)
            preference_score = 0.8
            combined_queries = (intent.use_case or []) + (intent.preferences or [])
            if combined_queries:
                matched_count = 0
                product_text = f"{product.name} {product.description} {' '.join(product.features)} {' '.join(product.best_for)}".lower()
                
                for term in combined_queries:
                    tokens = term.lower().split()
                    if any(token in product_text for token in tokens if len(token) > 2):
                        matched_count += 1
                
                preference_score = min(1.0, 0.6 + (0.4 * (matched_count / max(1, len(combined_queries)))))
            else:
                preference_score = 0.9

            # 3. Rating Score (0.0 to 1.0)
            rating_score = (product.rating / 5.0)

            # 4. Final Weighted Score
            is_outside_price_bracket = (
                (intent.max_price and product.price > intent.max_price * 1.10) or
                (intent.min_price and product.price < intent.min_price * 0.80)
            )
            
            final_composite = (
                (similarity_norm * 0.45) +
                (price_score * 0.30) +
                (preference_score * 0.15) +
                (rating_score * 0.10)
            )

            if is_outside_price_bracket:
                final_composite = min(0.45, final_composite * 0.5)

            match_percentage = int(round(final_composite * 100))
            match_percentage = max(25, min(98, match_percentage))

            # Generate dynamic contextual reason
            reason = self._generate_match_reason(product, intent, match_percentage)

            scored_products.append(
                RecommendedProduct(
                    product=product,
                    match_score=match_percentage,
                    reason=reason,
                    score_breakdown={
                        "semantic": round(similarity_norm, 2),
                        "budget": round(price_score, 2),
                        "preference": round(preference_score, 2),
                        "rating": round(rating_score, 2)
                    }
                )
            )

        # Sort by match_score descending
        scored_products.sort(key=lambda x: x.match_score, reverse=True)
        return scored_products[:limit]

    def _generate_match_reason(self, product: Product, intent: UserIntent, match_pct: int) -> str:
        """Generates a concise, high-value AI reason for the recommendation."""
        matched_points = []

        # Check price compatibility
        if intent.budget and product.price <= intent.budget:
            savings = intent.budget - product.price
            if savings > 5000:
                matched_points.append(f"Fits within your ₹{intent.budget:,.0f} budget with ₹{savings:,.0f} to spare")
            else:
                matched_points.append(f"Directly fits your ₹{intent.budget:,.0f} budget")

        # Check use cases & best_for
        if product.best_for:
            matched_points.append(f"Optimized for {', '.join(product.best_for[:2])}")
        elif product.features:
            matched_points.append(f"Features {product.features[0]}")

        # Rating highlight
        if product.rating >= 4.7:
            matched_points.append(f"Top-rated ({product.rating}★) with {product.rating_count:,} reviews")

        if matched_points:
            return ". ".join(matched_points[:2]) + "."
        
        return f"High semantic match ({match_pct}%) for your shopping criteria."

recommendation_service = RecommendationService()
