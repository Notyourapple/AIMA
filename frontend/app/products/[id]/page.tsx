'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { ProductDetails } from '@/components/products/ProductDetails';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.getProductById(productId);
        setProduct(data);
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading product details and Pinecone similarity embeddings...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-xl font-bold text-slate-200">Product Not Found</div>
        <p className="text-xs text-slate-400">{error || 'The requested product could not be found in our database.'}</p>
        <Button onClick={() => router.push('/products')} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Catalog</span>
        </Button>
      </div>
    );
  }

  return <ProductDetails product={product} />;
}
