import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
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
