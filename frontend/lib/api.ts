import { ChatRequest, ChatResponse, Product, SimilarProduct, AIProviderInfo } from '@/types';

/**
 * Resolves the API Base URL cleanly for all environments:
 * 1. NEXT_PUBLIC_API_URL environment variable (if provided)
 * 2. Development mode fallback -> http://localhost:8000
 * 3. Production mode fallback -> https://aima-thu5.onrender.com (Render backend)
 * 
 * This guarantees deployed frontend builds NEVER default to localhost:8000.
 */
const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }

  // Production fallback to live Render service
  return 'https://aima-thu5.onrender.com';
};

export const API_BASE_URL = getBaseUrl();

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to send message' }));
      throw new Error(err.detail || `Server returned error ${response.status}`);
    }

    return response.json();
  }

  async getProviders(): Promise<{ providers: AIProviderInfo[]; default_provider: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/providers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch AI providers: ${response.statusText}`);
      }

      return response.json();
    } catch (err) {
      console.warn('Could not fetch dynamic providers from backend, using safe defaults:', err);
      return {
        providers: [
          {
            id: 'openai',
            name: 'OpenAI',
            model: 'gpt-4o-mini',
            available: true,
            description: 'OpenAI Cloud API (GPT-4o-mini)',
            is_default: true,
          },
          {
            id: 'ollama',
            name: 'Local AI',
            model: 'qwen2.5:3b',
            available: true,
            description: 'Local AI (Qwen 2.5 3B via Ollama)',
            is_default: false,
          },
        ],
        default_provider: 'openai',
      };
    }
  }

  async getProducts(params?: {
    category?: string;
    min_price?: number;
    max_price?: number;
    brand?: string;
    query?: string;
    limit?: number;
  }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `${this.baseUrl}/api/products${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json();
  }

  async getProductById(productId: string): Promise<Product> {
    const response = await fetch(`${this.baseUrl}/api/products/${encodeURIComponent(productId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Product not found: ${response.statusText}`);
    }

    return response.json();
  }

  async getSimilarProducts(productId: string, limit: number = 4): Promise<SimilarProduct[]> {
    const response = await fetch(
      `${this.baseUrl}/api/products/${encodeURIComponent(productId)}/similar?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch similar products: ${response.statusText}`);
    }

    return response.json();
  }

  async checkHealth(): Promise<{ status: string; total_products: number; pinecone_connected: boolean; services?: any }> {
    const response = await fetch(`${this.baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('API is offline');
    }
    return response.json();
  }
}

export const api = new ApiClient();
