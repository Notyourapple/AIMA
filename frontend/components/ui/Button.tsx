import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const variants = {
      primary:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500/40 active:scale-[0.98]',
      secondary:
        'bg-surface-50 hover:bg-surface-100 text-slate-200 border border-white/10 hover:border-white/20 active:scale-[0.98]',
      outline:
        'bg-transparent hover:bg-white/5 text-slate-300 border border-white/15 hover:border-white/30 hover:text-white',
      ghost: 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200',
      glass:
        'bg-white/[0.06] hover:bg-white/[0.12] text-slate-100 backdrop-blur-md border border-white/10 hover:border-white/25 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
      md: 'text-sm px-4 py-2 rounded-xl gap-2',
      lg: 'text-base px-6 py-3 rounded-xl gap-2.5 font-medium',
      icon: 'p-2 rounded-lg aspect-square',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
