import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="h-14 bg-surface border-t border-border px-8 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-text-secondary mt-auto">
        <div>&copy; 2024 GeneTree Heritage</div>
        <div className="flex gap-8">
          <span>System Status: Optimal</span>
          <span>Privacy Vault Encrypted</span>
        </div>
      </footer>
    </div>
  );
}
