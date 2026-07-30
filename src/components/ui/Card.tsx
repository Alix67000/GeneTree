import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)] border border-border p-6',
        className
      )}
      {...props}
    />
  );
}
