'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Network } from 'lucide-react';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-3 max-w-2xl"
    >
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-[1px] shrink-0 mt-0.5 shadow-md shadow-indigo-500/20">
        <div className="w-full h-full bg-surface-200 rounded-[11px] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </div>

      {/* Typing Bubble */}
      <div className="glass-panel rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-300 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-slate-400 text-xs font-mono tracking-tight flex items-center gap-1.5 border-l border-white/10 pl-3">
          <Brain className="w-3.5 h-3.5 text-indigo-400" /> Querying Pinecone Vector Index...
        </span>
      </div>
    </motion.div>
  );
}
