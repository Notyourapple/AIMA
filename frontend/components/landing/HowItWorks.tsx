'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Brain,
  Binary,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowDown
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'User Query',
    subtitle: 'Natural language input expressing budget, use cases, and desires.',
    icon: MessageSquare,
    badge: 'Natural Language',
    color: 'text-indigo-400',
    border: 'border-indigo-500/30',
  },
  {
    step: '02',
    title: 'Intent Understanding',
    subtitle: 'LangChain & OpenAI extract category, price ceilings, and target specs.',
    icon: Brain,
    badge: 'Structured NLP',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  {
    step: '03',
    title: 'OpenAI Embeddings',
    subtitle: 'Transforms query semantics into 1536-dimensional high-density vectors.',
    icon: Binary,
    badge: 'text-embedding-3-small',
    color: 'text-sky-400',
    border: 'border-sky-500/30',
  },
  {
    step: '04',
    title: 'Pinecone Vector Search',
    subtitle: 'Sub-millisecond approximate nearest neighbor (ANN) cosine search.',
    icon: Database,
    badge: 'Vector DB Index',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  {
    step: '05',
    title: 'Product Retrieval',
    subtitle: 'Retrieves top candidate products with rich JSON specs and metadata.',
    icon: Layers,
    badge: 'Metadata Filtering',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  {
    step: '06',
    title: 'AI Recommendation Engine',
    subtitle: 'Hybrid scoring: 50% Semantic + 20% Budget + 20% Preferences + 10% Rating.',
    icon: Sparkles,
    badge: 'Multi-Factor Ranking',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
  },
  {
    step: '07',
    title: 'Personalized Results',
    subtitle: 'Generates conversational rationale and rich interactive product cards.',
    icon: CheckCircle2,
    badge: 'Ranked Output',
    color: 'text-indigo-400',
    border: 'border-indigo-500/30',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-3 mb-16">
        <h2 className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
          Technical Pipeline
        </h2>
        <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How the Vector Recommendation Engine Works
        </h3>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          An end-to-end autonomous flow converting free-form natural language queries into accurate product matches.
        </p>
      </div>

      {/* Visual Pipeline Stepper */}
      <div className="relative">
        {/* Vertical Center Glow Line */}
        <div className="absolute left-1/2 top-4 bottom-4 w-[2px] -translate-x-1/2 bg-gradient-to-b from-indigo-500 via-sky-500 to-emerald-500 opacity-20 hidden md:block" />

        <div className="space-y-6">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isEven = idx % 2 === 0;

            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 ${
                  isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content Card */}
                <div className={`w-full md:w-1/2 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                  <div className="p-5 rounded-2xl glass-card border border-white/[0.08] hover:border-indigo-500/30 transition-all group">
                    <div className={`flex items-center gap-2 mb-2 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        STEP {step.step}
                      </span>
                      <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                        {step.badge}
                      </Badge>
                    </div>

                    <h4 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                {/* Center Node Icon */}
                <div className="relative z-10 w-12 h-12 rounded-2xl bg-surface-100 border border-white/15 flex items-center justify-center shrink-0 shadow-lg shadow-black/60 group-hover:scale-110 transition-transform">
                  <Icon className={`w-5 h-5 ${step.color}`} />
                </div>

                {/* Spacer for 50/50 balance on desktop */}
                <div className="hidden md:block w-1/2" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
