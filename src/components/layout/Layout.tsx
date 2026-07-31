import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0 overflow-x-hidden w-full">
      <Header />
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 py-4">
        <Outlet />
      </main>
      <footer className="h-14 bg-surface border-t border-border px-8 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-text-secondary mt-auto">
        <div>&copy; 2026 GeneTree Heritage</div>
        <div className="flex gap-8">
          <span>System Status: Optimal</span>
          <span>Privacy Vault Encrypted</span>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
