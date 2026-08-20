'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, CornerDownLeft, Laptop, Smartphone, Headphones, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  initialSuggestions?: string[];
  placeholder?: string;
  autoFocus?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  'Best gaming laptop under ₹1 lakh with good GPU',
  'Comfortable running shoes for beginners under ₹8,000',
  'Wireless headphones with strong bass and ANC',
  'Best smartphone for photography and zoom under ₹50,000',
];

export function ChatInput({
  onSendMessage,
  isLoading,
  initialSuggestions = DEFAULT_SUGGESTIONS,
  placeholder = 'Ask anything about products (e.g. "Laptop for AI development under ₹1.2 lakh")...',
  autoFocus = true,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    onSendMessage(suggestion);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {/* Suggestions Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-[11px] font-mono text-slate-500 shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Suggestions:
        </span>
        {initialSuggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isLoading}
            className="shrink-0 px-3 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/30 text-slate-300 text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>{suggestion}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="relative rounded-2xl glass-panel border border-white/15 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-2xl transition-all p-2.5">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none resize-none px-3 py-1.5 max-h-32 min-h-[44px]"
        />

        <div className="flex items-center justify-between pt-2 border-t border-white/5 px-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span className="hidden sm:inline">Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px]">
              Enter ↵
            </kbd>
            <span className="hidden sm:inline">to submit, Shift+Enter for new line</span>
          </div>

          <Button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading}
            isLoading={isLoading}
            size="sm"
            className="rounded-xl px-4 py-2"
          >
            <span>Ask AI</span>
            <Send className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
