'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, MessageSquare, Compass, Bookmark, Cpu } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const pathname = usePathname();
  const { savedProducts } = useAppStore();

  const navLinks = [
    { href: '/chat', label: 'AI Assistant', icon: MessageSquare },
    { href: '/products', label: 'Explore Products', icon: Compass },
    { href: '/saved', label: 'Saved', icon: Bookmark, badge: savedProducts.length > 0 ? savedProducts.length : null },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-background/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
            <div className="w-full h-full bg-[#0B0D17] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white font-mono">AIMA</span>
              <Badge variant="brand" size="sm">VECTOR AGENT</Badge>
            </div>
            <span className="text-[10px] text-slate-400 -mt-0.5 tracking-wide">AI Marketplace Assistant</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
                {link.badge !== null && link.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold rounded-full border border-indigo-500/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link href="/chat">
            <Button size="sm" className="hidden sm:inline-flex">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-200" />
              <span>Launch Assistant</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
