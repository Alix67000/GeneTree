import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { currentUser, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-surface border-b border-border px-3 sm:px-6 flex items-center justify-between sticky top-0 z-50 w-full">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-accent rounded-full"></div>
        </div>
        <span className="font-display text-xl font-bold tracking-tight text-text-primary">GeneTree</span>
      </Link>
      <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
        {currentUser ? (
          <>
            <div className="hidden md:flex items-center gap-6 text-[13px] font-semibold text-text-secondary">
              <NavLink to="/tree" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Family Tree</NavLink>
              <NavLink to="/photos" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Gallery</NavLink>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="h-8 text-xs px-2 sm:px-3 shrink-0">Sign Out</Button>
            </div>
          </>
        ) : (
          <Button size="sm" onClick={loginWithGoogle} className="h-9">Sign In</Button>
        )}
      </nav>
    </header>
  );
}
