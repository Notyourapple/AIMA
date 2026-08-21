'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Cpu, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';

export function ProviderSelector() {
  const { selectedProvider, setSelectedProvider, availableProviders } = useAppStore();

  const openaiInfo = availableProviders.find((p) => p.id === 'openai');
  const ollamaInfo = availableProviders.find((p) => p.id === 'ollama');

  const isOpenAIAvailable = openaiInfo ? openaiInfo.available : true;
  const isOllamaAvailable = ollamaInfo ? ollamaInfo.available : true;

  return (
    <div className="flex items-center justify-between gap-2 py-1 px-1 text-xs">
      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
          AI Provider:
        </span>
      </div>

      {/* Segmented Control Pill */}
      <div className="flex items-center gap-1 p-1 bg-surface-300/80 backdrop-blur-md rounded-xl border border-white/10 shadow-inner">
        {/* OpenAI Option */}
        <button
          type="button"
          onClick={() => setSelectedProvider('openai')}
          className={`relative px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            selectedProvider === 'openai'
              ? 'text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          {selectedProvider === 'openai' && (
            <motion.div
              layoutId="activeProviderIndicator"
              className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg -z-10 shadow-lg shadow-indigo-600/25 border border-indigo-500/40"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span
            className={`w-2 h-2 rounded-full ${
              isOpenAIAvailable ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'
            }`}
          />
          <span>OpenAI</span>
          <span className="hidden sm:inline text-[10px] opacity-75 font-mono">GPT-4o</span>
          {!isOpenAIAvailable && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
              Fallback
            </span>
          )}
        </button>

        {/* Local AI Option */}
        <button
          type="button"
          onClick={() => setSelectedProvider('ollama')}
          className={`relative px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            selectedProvider === 'ollama'
              ? 'text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          {selectedProvider === 'ollama' && (
            <motion.div
              layoutId="activeProviderIndicator"
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg -z-10 shadow-lg shadow-purple-600/25 border border-purple-500/40"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span
            className={`w-2 h-2 rounded-full ${
              isOllamaAvailable ? 'bg-purple-400 shadow-sm shadow-purple-400/50' : 'bg-slate-500'
            }`}
          />
          <Cpu className="w-3 h-3 text-purple-300" />
          <span>Local AI</span>
          <span className="hidden sm:inline text-[10px] opacity-80 font-mono px-1 py-0.2 rounded bg-white/10 text-purple-200">
            Qwen 2.5 3B
          </span>
          {!isOllamaAvailable && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-700 text-slate-400 font-mono">
              Local
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
