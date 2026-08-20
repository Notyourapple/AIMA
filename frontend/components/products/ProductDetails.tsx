'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star,
  Bookmark,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Layers,
  MessageSquare,
  Share2,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { Product, SimilarProduct } from '@/types';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatPriceINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter();
  const { isProductSaved, toggleSaveProduct } = useAppStore();
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const saved = isProductSaved(product.id);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        setLoadingSimilar(true);
        const data = await api.getSimilarProducts(product.id, 4);
        setSimilarProducts(data);
      } catch (err) {
        console.error('Failed to load similar products:', err);
      } finally {
        setLoadingSimilar(false);
      }
    }
    fetchSimilar();
  }, [product.id]);

  const handleAskAIAboutProduct = () => {
    router.push(`/chat?prompt=${encodeURIComponent(`Tell me all the pros and cons of the ${product.brand} ${product.name} priced at ₹${product.price}`)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back Button */}
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Catalog</span>
        </Link>
      </div>

      {/* Main Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Image */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative w-full aspect-square rounded-3xl overflow-hidden glass-panel border border-white/10 bg-surface-200">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="brand" size="md" className="capitalize">
                {product.category}
              </Badge>
              <Badge variant="default" size="md">
                {product.brand}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-amber-400 text-sm font-semibold">
                <Star className="w-4 h-4 fill-amber-400 mr-1" />
                <span>{product.rating}</span>
              </div>
              <span className="text-xs text-slate-500">
                ({product.rating_count.toLocaleString('en-IN')} verified reviews)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="p-4 rounded-2xl bg-surface-100/90 border border-white/10 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Special Price</span>
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {formatPriceINR(product.price)}
              </span>
            </div>
            <Badge variant="success" size="md">In Stock & AI Verified</Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={() => toggleSaveProduct(product)}
              variant={saved ? 'primary' : 'outline'}
              className="flex-1 py-3"
            >
              <Bookmark className={`w-4 h-4 mr-2 ${saved ? 'fill-white' : ''}`} />
              <span>{saved ? 'Saved in Shortlist' : 'Bookmark Product'}</span>
            </Button>

            <Button
              onClick={handleAskAIAboutProduct}
              variant="glass"
              className="flex-1 py-3 border-indigo-500/40 text-indigo-300 hover:text-white"
            >
              <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
              <span>Ask AI About This</span>
            </Button>
          </div>

          {/* AI Match Rationale Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-surface-100 to-surface-100 border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> AI Analysis: Why This Product Stands Out
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {product.description}
            </p>
            {product.best_for && product.best_for.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Ideal Target Use-cases:</span>
                <div className="flex flex-wrap gap-1.5">
                  {product.best_for.map((tag) => (
                    <Badge key={tag} variant="purple" size="sm">
                      ✓ {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Key Features */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-slate-200">Key Highlights</h3>
            <ul className="space-y-2">
              {product.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" /> Technical Specifications
          </h2>

          <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
              {Object.entries(product.specifications).map(([key, value], idx) => (
                <div
                  key={key}
                  className={`p-4 flex items-center justify-between text-xs ${
                    idx % 2 === 0 ? 'bg-white/[0.01]' : 'bg-transparent'
                  }`}
                >
                  <span className="font-medium text-slate-400">{key}</span>
                  <span className="font-semibold text-slate-200 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pinecone Vector Similarity Section */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" /> Semantically Similar Products
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Retrieved using Pinecone high-dimensional cosine similarity embeddings.
            </p>
          </div>
        </div>

        {loadingSimilar ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-surface-100/50 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : similarProducts.length === 0 ? (
          <div className="text-xs text-slate-500 py-6">No related vector neighbors found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {similarProducts.map(({ product: simP, similarity_score }) => (
              <Link
                key={simP.id}
                href={`/products/${simP.id}`}
                className="group flex flex-col bg-surface-100/80 hover:bg-surface-50 border border-white/[0.08] hover:border-indigo-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-indigo-500/10 p-3 space-y-3"
              >
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-surface-300">
                  <img
                    src={simP.image_url}
                    alt={simP.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="brand" size="sm" className="font-mono text-[10px]">
                      {Math.round(similarity_score * 100)}% Sim
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{simP.brand}</div>
                  <h4 className="font-semibold text-xs text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {simP.name}
                  </h4>
                  <div className="text-xs font-bold text-white">
                    {formatPriceINR(simP.price)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
