import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'brand' | 'outline' | 'warning' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-slate-300 border border-white/10',
    brand: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    outline: 'bg-transparent text-slate-400 border border-white/15',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
