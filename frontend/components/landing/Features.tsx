'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Brain, Network, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const FEATURES = [
  {
    title: 'Conversational Shopping',
    description: 'Users can describe what they want naturally in plain English without tedious filter clicking or boolean search operators.',
    icon: MessageCircle,
    color: 'from-indigo-500 to-blue-500',
    border: 'hover:border-indigo-500/40',
  },
  {
    title: 'Semantic Search',
    description: 'Understand contextual meaning, intent, budget thresholds, and nuanced constraints instead of just matching literal keywords.',
    icon: Brain,
    color: 'from-purple-500 to-indigo-500',
    border: 'hover:border-purple-500/40',
  },
  {
    title: 'Vector Recommendations',
    description: 'Find similar and highly relevant products across 1536-dimensional embedding spaces indexed in Pinecone vector database.',
    icon: Network,
    color: 'from-sky-500 to-teal-500',
    border: 'hover:border-sky-500/40',
  },
  {
    title: 'Personalized Results',
    description: 'Hybrid multi-factor scoring adapts recommendations to your exact budget limits, rating standards, and multi-turn chat memory.',
    icon: Sparkles,
    color: 'from-amber-500 to-pink-500',
    border: 'hover:border-pink-500/40',
  },
];

export function Features() {
  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
          Core Capabilities
        </h2>
        <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Engineered for Next-Gen E-Commerce Discovery
        </h3>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Replacing brittle keyword search with high-dimensional vector embeddings and multi-turn autonomous shopping agents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURES.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`p-6 rounded-3xl bg-surface-100/70 border border-white/[0.08] ${feat.border} transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} p-[1px] shadow-lg`}>
                  <div className="w-full h-full bg-surface-200 rounded-[15px] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
