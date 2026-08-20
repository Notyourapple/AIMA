'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Bookmark, ExternalLink, Sparkles, Check, ArrowRight } from 'lucide-react';
import { RecommendedProduct } from '@/types';
import { useAppStore } from '@/lib/store';
import { formatPriceINR } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ProductCardProps {
  recommendedProduct: RecommendedProduct;
  index?: number;
}

export function ProductCard({ recommendedProduct, index = 0 }: ProductCardProps) {
  const { product, match_score, reason, score_breakdown } = recommendedProduct;
  const { isProductSaved, toggleSaveProduct } = useAppStore();
  const saved = isProductSaved(product.id);

  // Match score color
  const getMatchScoreBadge = (score: number) => {
    if (score >= 90) {
      return (
        <Badge variant="brand" size="sm" className="font-mono font-bold glow-pill">
          <Sparkles className="w-3 h-3 mr-0.5 text-indigo-400" />
          {score}% Match
        </Badge>
      );
    } else if (score >= 75) {
      return (
        <Badge variant="success" size="sm" className="font-mono font-bold">
          {score}% Match
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" size="sm" className="font-mono">
          {score}% Match
        </Badge>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="group relative flex flex-col bg-surface-100/90 hover:bg-surface-50/95 border border-white/[0.08] hover:border-indigo-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl shadow-black/40 hover:shadow-indigo-500/10"
    >
      {/* Product Image Container */}
      <div className="relative w-full h-44 bg-surface-300 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-100 via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          {getMatchScoreBadge(match_score)}

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleSaveProduct(product);
            }}
            className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
              saved
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-black/40 text-slate-300 hover:text-white border border-white/10 hover:bg-black/60'
            }`}
            title={saved ? 'Remove from saved' : 'Save product'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-rose-400' : ''}`} />
          </button>
        </div>

        {/* Category & Brand Pill */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
            {product.brand}
          </span>
          <span className="text-[10px] text-slate-400 capitalize bg-white/[0.05] backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/5">
            {product.category}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2">
            <Link href={`/products/${product.id}`} className="group/title">
              <h4 className="font-semibold text-sm text-slate-100 group-hover/title:text-indigo-400 transition-colors line-clamp-1">
                {product.name}
              </h4>
            </Link>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center text-amber-400 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
              <span>{product.rating}</span>
            </div>
            <span className="text-[11px] text-slate-500">
              ({product.rating_count.toLocaleString('en-IN')} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white tracking-tight">
              {formatPriceINR(product.price)}
            </span>
          </div>

          {/* AI Reason Box */}
          <div className="mt-3 p-2.5 rounded-xl bg-indigo-500/[0.07] border border-indigo-500/20 text-xs text-indigo-200/90 leading-relaxed">
            <div className="flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-400 mb-1">
              <Sparkles className="w-3 h-3" /> AI Match Rationale
            </div>
            <p className="line-clamp-2">{reason}</p>
          </div>

          {/* Best For Tags */}
          {product.best_for && product.best_for.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {product.best_for.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-slate-400 bg-white/[0.04] border border-white/5 px-2 py-0.5 rounded-md"
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-white/5 flex items-center gap-2">
          <Link href={`/products/${product.id}`} className="flex-1">
            <Button variant="glass" size="sm" className="w-full text-xs py-2">
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
          <button
            onClick={() => toggleSaveProduct(product)}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              saved
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border-white/10'
            }`}
            title={saved ? 'Saved' : 'Save'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-rose-400' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
