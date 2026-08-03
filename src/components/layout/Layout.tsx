import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0 w-full">
      <Header />
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
