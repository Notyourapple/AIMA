'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Laptop, Smartphone, Headphones, Footprints, Sparkles, X } from 'lucide-react';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  { id: '', label: 'All Products', icon: Sparkles },
  { id: 'laptop', label: 'Laptops', icon: Laptop },
  { id: 'smartphone', label: 'Smartphones', icon: Smartphone },
  { id: 'headphones', label: 'Audio & ANC', icon: Headphones },
  { id: 'shoes', label: 'Running Shoes', icon: Footprints },
];

const PRICE_RANGES = [
  { label: 'All Prices', min: undefined, max: undefined },
  { label: 'Under ₹15,000', min: 0, max: 15000 },
  { label: '₹15,000 - ₹50,000', min: 15000, max: 50000 },
  { label: '₹50,000 - ₹1,00,000', min: 50000, max: 100000 },
  { label: 'Above ₹1,00,000', min: 100000, max: undefined },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRangeIndex, setPriceRangeIndex] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [category, priceRangeIndex]);

  const fetchProducts = async (customQuery?: string) => {
    try {
      setLoading(true);
      const activePrice = PRICE_RANGES[priceRangeIndex];
      const data = await api.getProducts({
        category: category || undefined,
        min_price: activePrice.min,
        max_price: activePrice.max,
        query: customQuery !== undefined ? customQuery : searchQuery || undefined,
      });
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(searchQuery);
  };

  const clearFilters = () => {
    setCategory('');
    setSearchQuery('');
    setPriceRangeIndex(0);
    fetchProducts('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="brand" size="sm">PRODUCT CATALOG</Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Explore AI Vector Catalog
          </h1>
          <p className="text-sm text-slate-400">
            Browse our curated collection of high-performance laptops, smartphones, headphones, and shoes.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search by keywords or intent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Filter Tabs & Options */}
      <div className="space-y-4 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/50'
                    : 'bg-surface-100 text-slate-400 hover:text-slate-200 hover:bg-surface-50 border border-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Price Range Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-mono text-[11px] mr-1">Price Filter:</span>
          {PRICE_RANGES.map((range, idx) => (
            <button
              key={range.label}
              onClick={() => setPriceRangeIndex(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                priceRangeIndex === idx
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {range.label}
            </button>
          ))}

          {(category || priceRangeIndex !== 0 || searchQuery) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <ProductGrid products={products} isLoading={loading} />
    </div>
  );
}
