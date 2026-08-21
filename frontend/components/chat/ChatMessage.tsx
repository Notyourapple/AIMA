'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, Target, Wallet, Layers, HelpCircle } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { Badge } from '@/components/ui/Badge';
import { formatPriceINR } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectPrompt?: (prompt: string) => void;
}

export function ChatMessage({ message, onSelectPrompt }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end gap-3 max-w-4xl ml-auto"
      >
        <div className="flex flex-col items-end">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-lg shadow-indigo-600/15 max-w-xl leading-relaxed border border-indigo-500/30">
            {message.content}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 px-1">{message.timestamp}</span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-surface-50 border border-white/10 flex items-center justify-center shrink-0 text-slate-300">
          <User className="w-4 h-4 text-slate-400" />
        </div>
      </motion.div>
    );
  }

  // Assistant Message
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 max-w-4xl"
    >
      {/* Assistant Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-[1px] shrink-0 mt-1 shadow-md shadow-indigo-500/20">
        <div className="w-full h-full bg-surface-200 rounded-[11px] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
      </div>

      <div className="flex-1 space-y-4 min-w-0">
        {/* Intent Tags (if available) */}
        {message.intent && (message.intent.category || message.intent.budget || message.intent.use_case.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] font-mono text-slate-500 mr-1 flex items-center gap-1">
              <Target className="w-3 h-3 text-indigo-400" /> Understood Intent:
            </span>
            {message.intent.category && (
              <Badge variant="brand" size="sm" className="capitalize">
                <Layers className="w-3 h-3" /> {message.intent.category}
              </Badge>
            )}
            {message.intent.min_price && message.intent.max_price ? (
              <Badge variant="success" size="sm">
                <Wallet className="w-3 h-3" /> {formatPriceINR(message.intent.min_price)} - {formatPriceINR(message.intent.max_price)}
              </Badge>
            ) : message.intent.target_price && !message.intent.budget ? (
              <Badge variant="success" size="sm">
                <Wallet className="w-3 h-3" /> Around {formatPriceINR(message.intent.target_price)}
              </Badge>
            ) : message.intent.budget ? (
              <Badge variant="success" size="sm">
                <Wallet className="w-3 h-3" /> Under {formatPriceINR(message.intent.budget)}
              </Badge>
            ) : message.intent.min_price ? (
              <Badge variant="success" size="sm">
                <Wallet className="w-3 h-3" /> Above {formatPriceINR(message.intent.min_price)}
              </Badge>
            ) : null}
            {message.intent.use_case.map((uc) => (
              <Badge key={uc} variant="outline" size="sm" className="text-slate-300">
                {uc}
              </Badge>
            ))}
          </div>
        )}

        {/* Textual Response Bubble */}
        <div className="glass-panel rounded-2xl rounded-tl-sm p-4 sm:p-5 text-sm text-slate-200 leading-relaxed space-y-2 border border-white/10 shadow-lg">
          {message.content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('• ')) {
              return (
                <div key={idx} className="space-y-1.5 my-2 pl-1">
                  {paragraph.split('\n').map((line, lIdx) => (
                    <div key={lIdx} className="text-slate-300 text-xs sm:text-sm pl-2 border-l-2 border-indigo-500/40">
                      {renderFormattedText(line)}
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <p key={idx} className="text-slate-300 text-xs sm:text-sm">
                {renderFormattedText(paragraph)}
              </p>
            );
          })}
        </div>

        {/* Recommended Products Grid */}
        {message.products && message.products.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-300 tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Vector Recommendation Results ({message.products.length})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {message.products.map((rec, idx) => (
                <ProductCard key={rec.product.id} recommendedProduct={rec} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Suggested Follow-up Prompts */}
        {message.suggested_followups && message.suggested_followups.length > 0 && (
          <div className="pt-2 space-y-1.5">
            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <HelpCircle className="w-3 h-3 text-indigo-400" /> Suggested Follow-ups:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {message.suggested_followups.map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => onSelectPrompt && onSelectPrompt(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition-all text-left flex items-center gap-1.5 group"
                >
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">→</span>
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
          <span>{message.timestamp}</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${message.provider_used === 'ollama' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
            <span>
              {message.provider_used === 'ollama'
                ? 'Powered by Local AI · Qwen 2.5 3B'
                : 'Powered by OpenAI'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Basic inline markdown bold parser helper
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
