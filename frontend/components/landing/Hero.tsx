'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Compass, Search, CornerDownLeft, Brain, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const SAMPLE_PROMPTS = [
  "Find me a gaming laptop under ₹1 lakh with a good GPU",
  "I need comfortable running shoes for marathon training under ₹12,000",
  "Best smartphone for photography and 4K video recording",
  "Noise cancelling headphones with LDAC audio and 30+ hour battery",
];

export function Hero() {
  const router = useRouter();
  const [promptIndex, setPromptIndex] = useState(0);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % SAMPLE_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchValue.trim() || SAMPLE_PROMPTS[promptIndex];
    router.push(`/chat?prompt=${encodeURIComponent(query)}`);
  };

  return (
    <div className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-sky-500/10 to-purple-600/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        {/* Top Tag */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-mono text-slate-300 font-medium">
            Autonomous Conversational Shopping Agent & Vector Engine
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Find What You Want. <br />
            <span className="gradient-brand-text">Just Ask.</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            An autonomous AI shopping assistant powered by conversational intelligence, OpenAI embeddings, and Pinecone semantic vector search.
          </p>
        </motion.div>

        {/* Interactive Conversational Search Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <form
            onSubmit={handleSearchSubmit}
            className="relative rounded-2xl glass-panel p-2 border border-white/15 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/25 shadow-2xl transition-all"
          >
            <div className="flex items-center gap-3 px-3 py-1.5">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={`"${SAMPLE_PROMPTS[promptIndex]}"`}
                className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <Button type="submit" size="sm" className="shrink-0 rounded-xl px-4 py-2.5">
                <span>Ask AI</span>
                <CornerDownLeft className="w-3.5 h-3.5 ml-1.5 opacity-80" />
              </Button>
            </div>
          </form>

          {/* Quick Prompt Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            <span className="text-slate-500 font-mono text-[11px]">Popular searches:</span>
            {SAMPLE_PROMPTS.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => router.push(`/chat?prompt=${encodeURIComponent(prompt)}`)}
                className="px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-slate-200 transition-all text-[11px] truncate max-w-[200px] sm:max-w-none"
              >
                {prompt}
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link href="/chat">
            <Button size="lg" className="w-full sm:w-auto px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30">
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Try the Assistant</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          <Link href="/products">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-3.5 rounded-2xl">
              <Compass className="w-4 h-4 mr-2 text-slate-400" />
              <span>Explore Products</span>
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
