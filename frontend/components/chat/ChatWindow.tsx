'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Search, ShieldCheck, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { ChatMessage as ChatMessageType } from '@/types';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

interface ChatWindowProps {
  initialPrompt?: string;
}

export function ChatWindow({ initialPrompt }: ChatWindowProps) {
  const {
    messages,
    addMessage,
    activeConversationId,
    selectedProvider,
    setAvailableProviders,
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch AI providers status on mount
  useEffect(() => {
    async function loadProviders() {
      try {
        const data = await api.getProviders();
        if (data && data.providers) {
          setAvailableProviders(data.providers);
        }
      } catch (e) {
        console.error('Failed to load AI providers:', e);
      }
    }
    loadProviders();
  }, []);

  // If initialPrompt passed, send it automatically
  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: 'msg_' + Date.now().toString(36),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addMessage(userMessage);
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage({
        message: text,
        conversation_id: activeConversationId,
        provider: selectedProvider,
      });

      const assistantMessage: ChatMessageType = {
        id: 'msg_res_' + Date.now().toString(36),
        role: 'assistant',
        content: response.response,
        products: response.products,
        intent: response.intent,
        suggested_followups: response.suggested_followups,
        provider_used: response.provider_used || selectedProvider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      addMessage(assistantMessage);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessageType = {
        id: 'msg_err_' + Date.now().toString(36),
        role: 'assistant',
        content: 'Unable to connect to the AI service. Please try again in a moment.',
        provider_used: selectedProvider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6 py-12">
            {/* Hero Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-[1px] shadow-2xl shadow-indigo-500/25"
            >
              <div className="w-full h-full bg-surface-200 rounded-[15px] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                How can I assist your shopping today?
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Describe your requirements, preferred features, or budget in natural language. Choose between <strong>OpenAI</strong> or <strong>Local AI (Qwen 2.5 3B)</strong> for smart shopping recommendations.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-2">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <Brain className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-semibold text-slate-200">Dual AI Intelligence</h4>
                <p className="text-[11px] text-slate-500">Switch between OpenAI & Local Qwen 2.5 3B</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <Zap className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-semibold text-slate-200">Vector Embeddings</h4>
                <p className="text-[11px] text-slate-500">Retrieves semantically similar matches via Pinecone</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-semibold text-slate-200">Hybrid Scoring</h4>
                <p className="text-[11px] text-slate-500">Balances budget, rating, and use-case fit</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onSelectPrompt={handleSendMessage}
                />
              ))}
            </AnimatePresence>

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed Chat Input Area */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-background via-background/95 to-transparent border-t border-white/5 shrink-0 z-20">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
