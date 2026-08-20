'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Zap, Database, Brain, Terminal } from 'lucide-react';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <Hero />

      {/* Features */}
      <Features />

      {/* How It Works Pipeline */}
      <HowItWorks />

      {/* Tech Stack Banner */}
      <section className="py-16 border-y border-white/[0.08] bg-surface-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="outline" size="sm" className="font-mono">
            ENGINEERING STACK
          </Badge>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Built with Modern Full-Stack AI Architecture
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-4 max-w-4xl mx-auto">
            {[
              { name: 'Next.js 14', type: 'App Router' },
              { name: 'FastAPI', type: 'Async Backend' },
              { name: 'OpenAI API', type: 'Embeddings & LLM' },
              { name: 'Pinecone', type: 'Vector Database' },
              { name: 'LangChain', type: 'Agent Orchestration' },
              { name: 'Tailwind CSS', type: 'Design System' },
            ].map((tech) => (
              <div
                key={tech.name}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1 hover:border-indigo-500/30 transition-all"
              >
                <div className="font-bold text-xs text-slate-200">{tech.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{tech.type}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-surface-100 to-surface-100 border border-indigo-500/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Experience Semantic Shopping?
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Start chatting with the AI agent to discover laptops, smartphones, audio gear, and running shoes.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/chat">
              <Button size="lg" className="px-8 py-3.5 shadow-xl shadow-indigo-500/25">
                <Sparkles className="w-4 h-4 mr-2" />
                <span>Launch Conversational Assistant</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.08] bg-surface-300/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 font-mono">AIMA</span>
            <span>— AI Marketplace Assistant & Vector Engine</span>
          </div>
          <div>Powered by Next.js, FastAPI, OpenAI, LangChain & Pinecone</div>
        </div>
      </footer>
    </div>
  );
}
