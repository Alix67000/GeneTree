import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGitCommit, FiImage, FiClock, FiUser, FiSettings } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

const ADMIN_EMAILS = ['ahmadi67000@gmail.com'];

export function BottomNav() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email);

  if (!currentUser) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around z-50 md:hidden pb-safe">
      <NavLink 
        to="/tree" 
        className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
      >
        <FiGitCommit size={20} className="mb-1" />
        <span>Arbre</span>
      </NavLink>
      
      <NavLink 
        to="/photos" 
        className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
      >
        <FiImage size={20} className="mb-1" />
        <span>Galerie</span>
      </NavLink>

      <NavLink 
        to="/timeline" 
        className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
      >
        <FiClock size={20} className="mb-1" />
        <span>Chronologie</span>
      </NavLink>

      {isAdmin ? (
        <NavLink 
          to="/admin" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <FiSettings size={20} className="mb-1" />
          <span>Admin</span>
        </NavLink>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium text-text-secondary">
          <FiUser size={20} className="mb-1" />
          <span>Membre</span>
        </div>
      )}
    </nav>
  );
}
