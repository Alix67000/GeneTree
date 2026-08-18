import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiGitCommit, FiImage, FiClock, FiUser, FiSettings, FiSun, FiMapPin, FiBookOpen, FiStar, FiLayers, FiX } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

const ADMIN_EMAILS = ['ahmadi67000@gmail.com'];

export function BottomNav() {
  const { currentUser } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const isAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email);

  if (!currentUser) return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around z-50 md:hidden pb-safe">
        <NavLink 
          to="/star-network" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <FiStar size={20} className="mb-1" />
          <span>Star</span>
        </NavLink>
        
        <NavLink 
          to="/photos" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <FiImage size={20} className="mb-1" />
          <span>Gallery</span>
        </NavLink>

        <button 
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <FiLayers size={20} className="mb-1" />
          <span>Views</span>
        </button>

        <NavLink 
          to="/timeline" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <FiClock size={20} className="mb-1" />
          <span>Timeline</span>
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
            <span>Member</span>
          </div>
        )}
      </nav>

      {/* Bottom Drawer for Views */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 md:hidden ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setDrawerOpen(false)}
      >
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-xl transition-transform duration-300 ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display font-semibold text-lg text-text-primary">Advanced Views</h3>
            <button onClick={() => setDrawerOpen(false)} className="text-text-secondary hover:text-text-primary p-2">
              <FiX size={24} />
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4 pb-safe-offset-4">
            <NavLink 
              to="/network" 
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => `flex flex-col items-center gap-2 p-4 rounded-xl border ${isActive ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-text-secondary hover:border-primary/50 hover:text-primary'}`}
            >
              <FiSun size={28} />
              <span className="text-sm font-medium text-center">Solar Kinship</span>
            </NavLink>
            <NavLink 
              to="/tree" 
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => `flex flex-col items-center gap-2 p-4 rounded-xl border ${isActive ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-text-secondary hover:border-primary/50 hover:text-primary'}`}
            >
              <FiGitCommit size={28} />
              <span className="text-sm font-medium text-center">Family Tree</span>
            </NavLink>
            <NavLink 
              to="/pathfinder" 
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => `flex flex-col items-center gap-2 p-4 rounded-xl border ${isActive ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-text-secondary hover:border-primary/50 hover:text-primary'}`}
            >
              <FiMapPin size={28} />
              <span className="text-sm font-medium text-center">Pathfinder</span>
            </NavLink>
            <NavLink 
              to="/passport" 
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => `flex flex-col items-center gap-2 p-4 rounded-xl border ${isActive ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-text-secondary hover:border-primary/50 hover:text-primary'}`}
            >
              <FiBookOpen size={28} />
              <span className="text-sm font-medium text-center">Passport</span>
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
}
