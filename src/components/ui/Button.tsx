import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-button)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        {
          'bg-primary text-white hover:bg-primary-light': variant === 'primary',
          'bg-accent text-white hover:opacity-90': variant === 'accent',
          'border border-border bg-transparent hover:bg-black/5': variant === 'outline',
          'bg-transparent hover:bg-black/5': variant === 'ghost',
          'h-9 px-4 text-sm': size === 'sm',
          'h-11 px-6 text-base': size === 'md',
          'h-14 px-8 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}
