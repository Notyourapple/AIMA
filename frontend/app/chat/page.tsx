'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';

function ChatContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || undefined;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>(initialPrompt);

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onSelectPrompt={(p) => setSelectedPrompt(p)}
      />

      {/* Main Conversation Window */}
      <ChatWindow initialPrompt={selectedPrompt} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center h-[calc(100vh-4rem)] text-sm text-slate-400">
          Loading AI Marketplace Assistant...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
