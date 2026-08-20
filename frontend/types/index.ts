export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'laptop' | 'smartphone' | 'headphones' | 'shoes' | string;
  price: number;
  rating: number;
  rating_count: number;
  image_url: string;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  best_for: string[];
}

export interface ScoreBreakdown {
  semantic: number;
  budget: number;
  preference: number;
  rating: number;
}

export interface RecommendedProduct {
  product: Product;
  match_score: number;
  reason: string;
  score_breakdown?: ScoreBreakdown;
}

export interface UserIntent {
  category?: string;
  budget?: number;
  min_price?: number;
  max_price?: number;
  target_price?: number;
  currency: string;
  use_case: string[];
  preferences: string[];
  comparison_requested?: boolean;
  follow_up?: boolean;
  extracted_query?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  conversation_id: string;
  response: string;
  products: RecommendedProduct[];
  intent?: UserIntent;
  suggested_followups: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: RecommendedProduct[];
  intent?: UserIntent;
  suggested_followups?: string[];
  timestamp: string;
}

export interface SimilarProduct {
  product: Product;
  similarity_score: number;
  reason?: string;
}

export interface ConversationHistoryItem {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}
