import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export function Card({ className, glass = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300',
        glass ? 'glass-card' : 'bg-surface-100 border border-white/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pt-3 border-t border-white/5 flex items-center', className)} {...props}>
      {children}
    </div>
  );
}
