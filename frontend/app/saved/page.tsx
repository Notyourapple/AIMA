'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function SavedPage() {
  const { savedProducts, clearSavedProducts } = useAppStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="brand" size="sm">WISHLIST & SHORTLIST</Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bookmark className="w-7 h-7 text-indigo-400 fill-indigo-400/30" />
            Saved Products ({savedProducts.length})
          </h1>
          <p className="text-sm text-slate-400">
            Compare your shortlisted recommendations or ask the AI assistant for a head-to-head breakdown.
          </p>
        </div>

        {savedProducts.length > 0 && (
          <div className="flex items-center gap-3">
            <Button
              onClick={clearSavedProducts}
              variant="outline"
              size="sm"
              className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Clear Shortlist</span>
            </Button>

            <Link href="/chat">
              <Button size="sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>Compare with AI</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {savedProducts.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel text-center max-w-md mx-auto space-y-4 my-12">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Your shortlist is empty</h3>
          <p className="text-xs text-slate-400">
            Bookmark items while chatting with the AI assistant or browsing the product catalog.
          </p>
          <div className="pt-2">
            <Link href="/chat">
              <Button size="sm">
                <span>Start Shopping</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <ProductGrid products={savedProducts} />
      )}
    </div>
  );
}
