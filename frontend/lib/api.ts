import { ChatRequest, ChatResponse, Product, SimilarProduct } from '@/types';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

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

  async checkHealth(): Promise<{ status: string; total_products: number; pinecone_connected: boolean }> {
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
