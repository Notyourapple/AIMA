'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ChatMessage, ConversationHistoryItem } from '@/types';

interface AppContextType {
  savedProducts: Product[];
  toggleSaveProduct: (product: Product) => void;
  isProductSaved: (productId: string) => boolean;
  clearSavedProducts: () => void;
  
  // Chat state
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  conversations: ConversationHistoryItem[];
  createNewConversation: () => string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  addMessage: (msg: ChatMessage) => void;
  clearCurrentChat: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('session-default');
  const [conversations, setConversations] = useState<ConversationHistoryItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aima_saved_products');
      if (saved) setSavedProducts(JSON.parse(saved));

      const storedConvs = localStorage.getItem('aima_conversations');
      if (storedConvs) setConversations(JSON.parse(storedConvs));
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aima_saved_products', JSON.stringify(savedProducts));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [savedProducts]);

  const toggleSaveProduct = (product: Product) => {
    setSavedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isProductSaved = (productId: string) => {
    return savedProducts.some((p) => p.id === productId);
  };

  const clearSavedProducts = () => {
    setSavedProducts([]);
  };

  const createNewConversation = (): string => {
    const newId = 'conv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    const newConv: ConversationHistoryItem = {
      id: newId,
      title: 'New Shopping Session',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message_count: 0,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    setMessages([]);
    return newId;
  };

  const addMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
    // Update conversation item title and count if applicable
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          const title = c.message_count === 0 && msg.role === 'user'
            ? (msg.content.length > 28 ? msg.content.substring(0, 28) + '...' : msg.content)
            : c.title;
          return {
            ...c,
            title,
            message_count: c.message_count + 1,
          };
        }
        return c;
      })
    );
  };

  const clearCurrentChat = () => {
    setMessages([]);
  };

  return (
    <AppContext.Provider
      value={{
        savedProducts,
        toggleSaveProduct,
        isProductSaved,
        clearSavedProducts,
        activeConversationId,
        setActiveConversationId,
        conversations,
        createNewConversation,
        messages,
        setMessages,
        addMessage,
        clearCurrentChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
