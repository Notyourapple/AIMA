'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Bookmark, ArrowRight, Sparkles } from 'lucide-react';
import { Product } from '@/types';
import { useAppStore } from '@/lib/store';
import { formatPriceINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductGrid({ products, isLoading = false }: ProductGridProps) {
  const { isProductSaved, toggleSaveProduct } = useAppStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-80 rounded-2xl bg-surface-100/50 border border-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-slate-400 text-sm">No products found matching your filter criteria.</div>
        <p className="text-xs text-slate-500">Try adjusting price range or clearing keyword search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => {
        const saved = isProductSaved(p.id);
        return (
          <div
            key={p.id}
            className="group flex flex-col bg-surface-100/80 hover:bg-surface-50 border border-white/[0.08] hover:border-indigo-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-indigo-500/10"
          >
            {/* Image */}
            <div className="relative w-full h-48 bg-surface-300 overflow-hidden">
              <img
                src={p.image_url}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-100 via-transparent to-black/30" />

              {/* Category & Save */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                <span className="text-[11px] font-medium text-slate-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 capitalize">
                  {p.category}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSaveProduct(p);
                  }}
                  className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
                    saved
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-black/40 text-slate-300 hover:text-white border border-white/10 hover:bg-black/60'
                  }`}
                  title={saved ? 'Saved' : 'Save product'}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-rose-400' : ''}`} />
                </button>
              </div>

              <div className="absolute bottom-2 left-2.5">
                <span className="text-[10px] text-slate-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                  {p.brand}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <Link href={`/products/${p.id}`}>
                  <h4 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {p.name}
                  </h4>
                </Link>

                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-amber-400 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                    <span>{p.rating}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    ({p.rating_count.toLocaleString('en-IN')})
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-3">
                  <span className="text-base font-bold text-white tracking-tight">
                    {formatPriceINR(p.price)}
                  </span>
                </div>
              </div>

              <Link href={`/products/${p.id}`} className="pt-2 border-t border-white/5">
                <Button variant="glass" size="sm" className="w-full text-xs py-2">
                  <span>View Specifications</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
