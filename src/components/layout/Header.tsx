import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { currentUser, loginWithGoogle, logout } = useAuth();

  return (
    <header className="h-16 bg-surface border-b border-border px-8 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-accent rounded-full"></div>
        </div>
        <span className="font-display text-2xl font-bold tracking-tight text-text-primary">GeneTree</span>
      </Link>
      <nav className="flex items-center gap-8">
        {currentUser ? (
          <>
            <div className="flex items-center gap-8 text-[13px] font-semibold text-text-secondary">
              <NavLink to="/tree" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Family Tree</NavLink>
              <NavLink to="/photos" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Gallery</NavLink>
            </div>
            <div className="flex items-center gap-4 border-l border-border pl-8">
              <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center bg-accent text-white font-bold text-xs">
                {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="h-8 text-xs px-3">Sign Out</Button>
            </div>
          </>
        ) : (
          <Button size="sm" onClick={loginWithGoogle} className="h-9">Sign In</Button>
        )}
      </nav>
    </header>
  );
}
