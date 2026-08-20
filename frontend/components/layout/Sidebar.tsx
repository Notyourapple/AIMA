'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Plus,
  MessageSquare,
  Bookmark,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Smartphone,
  Headphones,
  Footprints,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onSelectPrompt?: (prompt: string) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed, onSelectPrompt }: SidebarProps) {
  const pathname = usePathname();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    savedProducts,
    clearSavedProducts,
    clearCurrentChat
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');

  const categories = [
    { name: 'Laptops', icon: Laptop, prompt: 'Find me top laptops for software development under ₹1.2 lakh' },
    { name: 'Smartphones', icon: Smartphone, prompt: 'Best camera smartphones with high optical zoom under ₹70,000' },
    { name: 'Headphones', icon: Headphones, prompt: 'Wireless noise cancelling headphones with LDAC and long battery' },
    { name: 'Running Shoes', icon: Footprints, prompt: 'Comfortable road running shoes with maximum cushioning under ₹8,000' },
  ];

  return (
    <aside
      className={`h-full border-r border-white/[0.08] bg-surface-200/90 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 relative z-30 ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Top Section */}
      <div className="p-3 flex flex-col gap-3">
        {/* Toggle Button */}
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-xs tracking-wider text-slate-300 uppercase font-mono">
                Workspace
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors ml-auto"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={() => createNewConversation()}
          variant="primary"
          size="sm"
          className={`w-full justify-center ${isCollapsed ? 'p-2.5' : 'py-2.5'}`}
          title="Start new shopping conversation"
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span>New Search</span>}
        </Button>

        {/* Category Shortcuts */}
        {!isCollapsed && (
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-2">
              Quick Categories
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {categories.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.name}
                    onClick={() => onSelectPrompt && onSelectPrompt(c.prompt)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 text-slate-300 text-xs transition-all text-left group"
                  >
                    <Icon className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs: History vs Saved */}
        {!isCollapsed && (
          <div className="flex items-center gap-1 p-1 bg-surface-300 rounded-xl border border-white/5 mt-1">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'saved'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({savedProducts.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Center Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {!isCollapsed && activeTab === 'history' && (
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No conversations yet.<br />Ask any shopping question!
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all text-left ${
                    activeConversationId === conv.id
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{conv.created_at}</span>
                </button>
              ))
            )}
          </div>
        )}

        {!isCollapsed && activeTab === 'saved' && (
          <div className="space-y-2">
            {savedProducts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No saved products yet.<br />Click the bookmark icon on any product card!
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Bookmarked</span>
                  <button
                    onClick={clearSavedProducts}
                    className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
                {savedProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="block p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-8 h-8 rounded-lg object-cover bg-surface-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-200 font-medium truncate group-hover:text-indigo-300 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ₹{p.price.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status & Settings */}
      <div className="p-3 border-t border-white/5 flex flex-col gap-2">
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-mono text-slate-300">Vector Engine Online</span>
            </div>
            <Badge variant="success" size="sm">Pinecone Ready</Badge>
          </div>
        ) : (
          <div className="flex justify-center py-2" title="Vector Engine Online">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        )}
      </div>
    </aside>
  );
}
