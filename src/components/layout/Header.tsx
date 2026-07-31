import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePersons } from '@/hooks/usePersons';
import { Button } from '@/components/ui/Button';
import { FiSearch } from 'react-icons/fi';

export function Header() {
  const { currentUser, loginWithGoogle, logout } = useAuth();
  const { persons } = usePersons();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredPersons = persons.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5); // limit to 5 results

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  const handleSelectSearchResult = (personId: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/person/${personId}`);
  };

  return (
    <header className="h-16 bg-surface border-b border-border px-8 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-accent rounded-full"></div>
        </div>
        <span className="font-display text-2xl font-bold tracking-tight text-text-primary">GeneTree</span>
      </Link>

      {currentUser && (
        <div className="flex-1 max-w-md mx-8 relative" ref={searchRef}>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher une personne..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          {isSearchOpen && searchQuery.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
              {filteredPersons.length > 0 ? (
                filteredPersons.map(person => (
                  <button
                    key={person.id}
                    onClick={() => handleSelectSearchResult(person.id)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                      {person.photoUrl ? (
                        <img src={person.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        person.firstName.charAt(0) + person.lastName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">{person.firstName} {person.lastName}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">Aucune personne trouvée</div>
              )}
            </div>
          )}
        </div>
      )}

      <nav className="flex items-center gap-8">
        {currentUser ? (
          <>
            <div className="flex items-center gap-8 text-[13px] font-semibold text-text-secondary">
              <NavLink to="/tree" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Family Tree</NavLink>
              <NavLink to="/photos" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Gallery</NavLink>
              <NavLink to="/timeline" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Timeline</NavLink>
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
