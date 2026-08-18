import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePersons } from '@/hooks/usePersons';
import { Button } from '@/components/ui/Button';
import { Person } from '@/types';

export function Header() {
  const { currentUser, loginWithGoogle, logout } = useAuth();
  const { persons } = usePersons();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim().length >= 2) {
      const results = persons.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectResult = (id: string) => {
    setSearchTerm('');
    setSearchResults([]);
    navigate(`/person/${id}`);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <>
      <header className="h-16 bg-surface border-b border-border px-3 sm:px-6 flex items-center justify-between sticky top-0 z-50 w-full gap-2">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-accent rounded-full"></div>
        </div>
        <span className="font-display text-xl font-bold tracking-tight text-text-primary hidden sm:inline">GeneTree</span>
      </Link>

      {currentUser && (
        <div className="relative flex-1 max-w-xs sm:max-w-sm mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search for a person..."
            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-full focus:outline-none focus:border-primary"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-10 left-0 right-0 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
              {searchResults.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectResult(p.id)}
                  className="px-3 py-2 text-xs hover:bg-surface-hover cursor-pointer border-b border-border last:border-0"
                >
                  {p.firstName} {p.lastName}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
        {currentUser ? (
          <>
            <div className="hidden md:flex items-center gap-5 text-[13px] font-semibold text-text-secondary">
              <NavLink to="/star-network" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Star Network</NavLink>
              <NavLink to="/photos" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Gallery</NavLink>
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  Views ▾
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden flex flex-col py-1">
                  <NavLink to="/network" className={({isActive}) => `px-4 py-2 text-sm hover:bg-surface-hover transition-colors ${isActive ? 'text-primary font-bold' : ''}`}>Solar Kinship (Radial)</NavLink>
                  <NavLink to="/tree" className={({isActive}) => `px-4 py-2 text-sm hover:bg-surface-hover transition-colors ${isActive ? 'text-primary font-bold' : ''}`}>Family Tree</NavLink>
                  <NavLink to="/pathfinder" className={({isActive}) => `px-4 py-2 text-sm hover:bg-surface-hover transition-colors ${isActive ? 'text-primary font-bold' : ''}`}>Kinship Pathfinder</NavLink>
                  <NavLink to="/passport" className={({isActive}) => `px-4 py-2 text-sm hover:bg-surface-hover transition-colors ${isActive ? 'text-primary font-bold' : ''}`}>Passport View</NavLink>
                </div>
              </div>
              <NavLink to="/timeline" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Timeline</NavLink>
              <NavLink to="/about" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>About</NavLink>
              {currentUser.email === 'ahmadi67000@gmail.com' && (
                <NavLink to="/admin" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Admin</NavLink>
              )}
            </div>
            <Link
              to="/person/add"
              className="h-8 px-2.5 sm:px-3 inline-flex items-center justify-center gap-1 bg-primary text-white rounded-lg text-xs font-medium shrink-0"
            >
              + Add
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 text-xs px-2 sm:px-3 shrink-0">Sign Out</Button>
            </div>
          </>
        ) : (
          <Button size="sm" onClick={loginWithGoogle} className="h-9">Sign In</Button>
        )}
      </nav>
    </header>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <h3 className="font-display text-lg font-bold text-text-primary">Sign Out</h3>
            <p className="text-sm text-text-secondary">
              Are you sure you want to sign out of GeneTree?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  await logout();
                  navigate('/');
                  window.location.reload();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
