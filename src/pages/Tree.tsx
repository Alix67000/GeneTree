import React, { useState, useEffect, useRef } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { getInitials } from '@/lib/utils';
import { FiPlus, FiUser, FiGrid, FiGitCommit, FiHeart, FiEye, FiArrowUp, FiArrowDown, FiSearch, FiChevronUp, FiChevronDown, FiUsers } from 'react-icons/fi';
import { Person } from '@/types';

export function Tree() {
  const { persons, loading } = usePersons();
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [centralPersonId, setCentralPersonId] = useState<string>('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Global family view panel state
  const [isGlobalPanelOpen, setIsGlobalPanelOpen] = useState<boolean>(true);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(null);

  const centralCardRef = useRef<HTMLDivElement>(null);

  // Set default central person when persons load
  useEffect(() => {
    if (persons.length > 0 && !centralPersonId) {
      const sorted = [...persons].sort((a, b) => {
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
      });
      setCentralPersonId(sorted[0].id);
    }
  }, [persons, centralPersonId]);

  const handleSelectCentral = (id: string) => {
    setCentralPersonId(id);
    setHighlightedPersonId(id);
    setTimeout(() => {
      if (centralCardRef.current) {
        centralCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    setTimeout(() => {
      setHighlightedPersonId(null);
    }, 2000);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/20"></div></div>;
  }

  const centralPerson = persons.find(p => p.id === centralPersonId) || persons[0];

  const parent1 = centralPerson ? persons.find(p => p.id === centralPerson.parentId1) : null;
  const parent2 = centralPerson ? persons.find(p => p.id === centralPerson.parentId2) : null;
  const spouse = centralPerson ? persons.find(p => p.id === centralPerson.spouseId) : null;
  const children = centralPerson ? persons.filter(p => p.parentId1 === centralPerson.id || p.parentId2 === centralPerson.id) : [];

  const parentsCount = (parent1 ? 1 : 0) + (parent2 ? 1 : 0);
  const childrenCount = children.length;

  const isConnectedToHovered = (pId: string) => {
    if (!hoveredId) return false;
    if (hoveredId === pId) return true;
    if (hoveredId === centralPerson?.id) {
      return pId === parent1?.id || pId === parent2?.id || pId === spouse?.id || children.some(c => c.id === pId);
    }
    if (centralPerson && (hoveredId === parent1?.id || hoveredId === parent2?.id || hoveredId === spouse?.id || children.some(c => c.id === hoveredId))) {
      return pId === centralPerson.id;
    }
    return false;
  };

  const filteredGlobalPersons = persons.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const renderPersonCard = (p: Person, roleLabel: string, badgeStyle: string, isCentral = false) => {
    const isHighlighted = isConnectedToHovered(p.id) || highlightedPersonId === p.id;

    return (
      <div 
        key={p.id} 
        ref={isCentral ? centralCardRef : null}
        className={`flex flex-col items-center transition-all duration-300 ${isHighlighted ? 'scale-105 ring-4 ring-accent rounded-2xl p-1 bg-accent/10 animate-bounce' : hoveredId ? 'opacity-60' : ''}`}
        onMouseEnter={() => setHoveredId(p.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <span className={`text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 rounded-full border shadow-xs ${badgeStyle}`}>
          {roleLabel}
        </span>
        <Card className={`hover:shadow-xl transition-all w-64 p-5 flex flex-col items-center text-center space-y-3 bg-white border ${isCentral ? 'ring-4 ring-primary/30 border-primary shadow-lg' : isHighlighted ? 'ring-2 ring-accent border-accent shadow-md' : 'border-border/80'}`}>
          <div className="w-16 h-16 rounded-full border-2 border-accent bg-border ring-4 ring-primary/5 shadow-md flex items-center justify-center text-xl font-display font-medium text-text-primary overflow-hidden">
            {p.photoUrl ? (
              <img src={p.photoUrl} alt={`${p.firstName} ${p.lastName}`} className="w-full h-full object-cover" />
            ) : (
              getInitials(p.firstName, p.lastName)
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-text-primary">{p.firstName} {p.lastName}</h3>
            <p className="text-xs text-text-secondary mt-0.5 italic">
              {p.birthDate ? new Date(p.birthDate).getFullYear() : 'Unknown'} {p.deathDate ? `— ${new Date(p.deathDate).getFullYear()}` : '— Present'}
            </p>
          </div>

          {isCentral && (
            <div className="flex items-center justify-center gap-2 w-full py-1.5 px-2 bg-primary/5 rounded-xl text-xs font-semibold text-primary">
              <span className="flex items-center gap-1"><FiArrowUp className="w-3 h-3" /> {parentsCount} parents</span>
              <span>•</span>
              <span className="flex items-center gap-1"><FiArrowDown className="w-3 h-3" /> {childrenCount} enfants</span>
            </div>
          )}

          <div className="flex items-center gap-2 w-full pt-2 border-t border-border/50">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs py-1 h-8"
              onClick={() => handleSelectCentral(p.id)}
            >
              <FiGitCommit className="mr-1" /> Centrer
            </Button>
            <Link to={`/person/${p.id}`} className="flex-1">
              <Button variant="primary" size="sm" className="w-full text-xs py-1 h-8">
                <FiEye className="mr-1" /> Fiche
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-3xl font-display font-semibold text-text-primary">Family Tree</h1>
          <p className="text-sm text-text-secondary mt-1">Explore and navigate your family lineage</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="flex bg-background p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'tree' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <FiGitCommit /> Arbre hiérarchique
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <FiGrid /> Grille
            </button>
          </div>

          <Link to="/person/add">
            <Button className="inline-flex items-center gap-2">
              <FiPlus /> Add Person
            </Button>
          </Link>
        </div>
      </div>

      {persons.length === 0 ? (
        <Card className="text-center py-16 flex flex-col items-center justify-center space-y-4 bg-white">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <FiUser size={24} />
          </div>
          <h2 className="text-xl font-display font-medium text-text-primary">Your tree is empty</h2>
          <p className="text-text-secondary">Start building your family tree by adding the first person.</p>
          <Link to="/person/add" className="inline-flex items-center gap-2 text-primary hover:text-primary-light font-medium mt-4">
            <FiPlus /> Add First Person
          </Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {persons.map(person => (
            <Card 
              key={person.id} 
              className="hover:shadow-lg transition-all cursor-pointer h-full flex flex-col items-center text-center p-6 space-y-4 bg-white"
              onClick={() => handleSelectCentral(person.id)}
            >
              <div className="w-20 h-20 rounded-full border-2 border-accent bg-border ring-4 ring-white shadow-lg flex items-center justify-center text-2xl font-display font-medium text-text-primary overflow-hidden">
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt={`${person.firstName} ${person.lastName}`} className="w-full h-full object-cover" />
                ) : (
                  getInitials(person.firstName, person.lastName)
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-text-primary">{person.firstName} {person.lastName}</h3>
                <p className="text-sm text-text-secondary mt-1 italic">
                  {person.birthDate ? new Date(person.birthDate).getFullYear() : 'Unknown'} {person.deathDate ? `— ${new Date(person.deathDate).getFullYear()}` : '— Present'}
                </p>
              </div>
              <div className="flex gap-2 w-full pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs"
                  onClick={(e) => { e.stopPropagation(); handleSelectCentral(person.id); setViewMode('tree'); }}
                >
                  Centrer dans l'arbre
                </Button>
                <Link to={`/person/${person.id}`} onClick={(e) => e.stopPropagation()} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full text-xs">Fiche</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Hierarchical Tree Mode */
        <div className="space-y-12">
          {/* Central person selector */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/20 max-w-xl mx-auto shadow-xs">
            <label className="text-sm font-semibold text-text-primary whitespace-nowrap flex items-center gap-2">
              <FiUser className="text-primary" /> Personne centrale :
            </label>
            <select
              value={centralPersonId}
              onChange={(e) => handleSelectCentral(e.target.value)}
              className="w-full sm:w-auto flex-1 px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {persons.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          {centralPerson && (
            <div className="relative flex flex-col items-center space-y-8 py-6">
              
              {/* Niveau Supérieur (Parents) */}
              <div className="w-full flex flex-col items-center relative">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-800 mb-4 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full shadow-xs">
                  <FiArrowUp className="text-blue-600" /> Niveau Supérieur — Parents
                </div>
                <div className="flex flex-wrap justify-center gap-12 relative">
                  {parent1 ? renderPersonCard(parent1, 'Parent 1', 'bg-blue-50 text-blue-700 border-blue-200') : null}
                  {parent2 ? renderPersonCard(parent2, 'Parent 2', 'bg-blue-50 text-blue-700 border-blue-200') : null}
                  {!parent1 && !parent2 && (
                    <div className="text-sm text-text-secondary italic bg-white/50 px-6 py-3 rounded-xl border border-dashed border-border">
                      Aucun parent enregistré pour cette personne
                    </div>
                  )}
                </div>
                {/* SVG Connecting line down from parents */}
                {(parent1 || parent2) && (
                  <div className="h-10 w-full flex justify-center items-center my-1">
                    <svg className="w-48 h-full" overflow="visible">
                      <path 
                        d="M 24 0 V 20 M 120 0 V 20 M 24 20 H 120 M 72 20 V 40" 
                        fill="none" 
                        stroke="currentColor" 
                        className={`stroke-2 transition-colors ${hoveredId && (hoveredId === parent1?.id || hoveredId === parent2?.id || hoveredId === centralPerson.id) ? 'text-primary' : 'text-primary/30'}`}
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Niveau Central (Génération actuelle: Personne centrale + Conjoint) */}
              <div className="w-full flex flex-col items-center relative">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800 mb-4 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full shadow-xs">
                  Génération Actuelle
                </div>
                <div className="flex flex-wrap justify-center items-center gap-6 relative">
                  {renderPersonCard(centralPerson, 'Personne Centrale', 'bg-amber-100 text-amber-900 border-amber-300', true)}
                  {spouse && (
                    <>
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-0.5 bg-rose-300"></div>
                        <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shadow-sm mx-1.5 animate-pulse">
                          <FiHeart className="w-4 h-4 fill-rose-500" />
                        </div>
                        <div className="w-8 h-0.5 bg-rose-300"></div>
                      </div>
                      {renderPersonCard(spouse, 'Conjoint(e)', 'bg-rose-50 text-rose-700 border-rose-200')}
                    </>
                  )}
                </div>

                {/* SVG Connecting line down to children */}
                {children.length > 0 && (
                  <div className="h-10 w-full flex justify-center items-center my-1">
                    <div className="w-0.5 h-10 bg-primary/40"></div>
                  </div>
                )}
              </div>

              {/* Niveau Inférieur (Enfants) */}
              <div className="w-full flex flex-col items-center relative">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-4 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full shadow-xs">
                  Niveau Inférieur — Enfants ({children.length}) <FiArrowDown className="text-emerald-600" />
                </div>
                {children.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-8">
                    {children.map(child => renderPersonCard(child, 'Enfant', 'bg-emerald-50 text-emerald-700 border-emerald-200'))}
                  </div>
                ) : (
                  <div className="text-sm text-text-secondary italic bg-white/50 px-6 py-3 rounded-xl border border-dashed border-border">
                    Aucun enfant enregistré
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* Vue globale de la famille (Drawer inférieur rétractable) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border shadow-2xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col">
          {/* Drawer Header / Toggle bar */}
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsGlobalPanelOpen(!isGlobalPanelOpen)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FiUsers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm text-text-primary flex items-center gap-2">
                  Vue globale de la famille (tous les membres) 
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">{persons.length}</span>
                </h3>
                <p className="text-xs text-text-secondary">Cliquez sur un membre pour le centrer instantanément dans l'arbre</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Filtrer un membre..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 rounded-full border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 w-48 sm:w-64"
                />
              </div>
              <Button variant="ghost" size="sm" className="p-1.5 h-8 w-8">
                {isGlobalPanelOpen ? <FiChevronDown className="w-5 h-5" /> : <FiChevronUp className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Drawer Content / List of mini-cards */}
          {isGlobalPanelOpen && (
            <div className="mt-3 pt-3 border-t border-border/60 max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pb-2">
              {filteredGlobalPersons.map(p => {
                const isCurrentCentral = p.id === centralPerson?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => { handleSelectCentral(p.id); setViewMode('tree'); }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer bg-background/60 hover:bg-white hover:shadow-sm ${isCurrentCentral ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border'}`}
                  >
                    <div className="w-9 h-9 rounded-full border border-accent bg-border flex items-center justify-center text-xs font-display font-bold text-text-primary overflow-hidden shrink-0">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={`${p.firstName} ${p.lastName}`} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(p.firstName, p.lastName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text-primary truncate">{p.firstName} {p.lastName}</p>
                      <p className="text-[10px] text-text-secondary truncate">
                        {p.birthDate ? new Date(p.birthDate).getFullYear() : '—'}
                      </p>
                    </div>
                  </div>
                );
              })}
              {filteredGlobalPersons.length === 0 && (
                <div className="col-span-full text-center py-4 text-xs text-text-secondary italic">
                  Aucun membre ne correspond à votre recherche.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
