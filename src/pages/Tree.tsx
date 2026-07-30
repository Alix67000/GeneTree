import React, { useState, useEffect } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { getInitials } from '@/lib/utils';
import { FiPlus, FiUser, FiGrid, FiGitCommit, FiHeart, FiEye, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { Person } from '@/types';

export function Tree() {
  const { persons, loading } = usePersons();
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [centralPersonId, setCentralPersonId] = useState<string>('');

  // Set default central person when persons load
  useEffect(() => {
    if (persons.length > 0 && !centralPersonId) {
      // Find oldest person by birthDate or first person
      const sorted = [...persons].sort((a, b) => {
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
      });
      setCentralPersonId(sorted[0].id);
    }
  }, [persons, centralPersonId]);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/20"></div></div>;
  }

  const centralPerson = persons.find(p => p.id === centralPersonId) || persons[0];

  const parent1 = centralPerson ? persons.find(p => p.id === centralPerson.parentId1) : null;
  const parent2 = centralPerson ? persons.find(p => p.id === centralPerson.parentId2) : null;
  const spouse = centralPerson ? persons.find(p => p.id === centralPerson.spouseId) : null;
  const children = centralPerson ? persons.filter(p => p.parentId1 === centralPerson.id || p.parentId2 === centralPerson.id) : [];

  const renderPersonCard = (p: Person, roleLabel?: string) => (
    <div key={p.id} className="flex flex-col items-center">
      {roleLabel && (
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 bg-white px-3 py-1 rounded-full border border-border shadow-xs">
          {roleLabel}
        </span>
      )}
      <Card className="hover:shadow-lg transition-all w-64 p-5 flex flex-col items-center text-center space-y-3 bg-white border border-border/80">
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
        <div className="flex items-center gap-2 w-full pt-2 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs py-1 h-8"
            onClick={() => setCentralPersonId(p.id)}
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

  return (
    <div className="space-y-8">
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
            <Link key={person.id} to={`/person/${person.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col items-center text-center p-6 space-y-4 bg-white">
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
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        /* Hierarchical Tree Mode */
        <div className="space-y-12">
          {/* Central person selector */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/20 max-w-xl mx-auto">
            <label className="text-sm font-semibold text-text-primary whitespace-nowrap flex items-center gap-2">
              <FiUser className="text-primary" /> Personne centrale :
            </label>
            <select
              value={centralPersonId}
              onChange={(e) => setCentralPersonId(e.target.value)}
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
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
                  <FiArrowUp className="text-primary" /> Niveau Supérieur — Parents
                </div>
                <div className="flex flex-wrap justify-center gap-8">
                  {parent1 ? renderPersonCard(parent1, 'Parent 1') : null}
                  {parent2 ? renderPersonCard(parent2, 'Parent 2') : null}
                  {!parent1 && !parent2 && (
                    <div className="text-sm text-text-secondary italic bg-white/50 px-6 py-3 rounded-xl border border-dashed border-border">
                      Aucun parent enregistré pour cette personne
                    </div>
                  )}
                </div>
                {/* Connector line down */}
                {(parent1 || parent2) && (
                  <div className="w-0.5 h-8 bg-primary/30 my-2"></div>
                )}
              </div>

              {/* Niveau Central (Génération actuelle: Personne centrale + Conjoint) */}
              <div className="w-full flex flex-col items-center relative">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-4 bg-primary/10 px-4 py-1.5 rounded-full">
                  Génération Actuelle
                </div>
                <div className="flex flex-wrap justify-center items-center gap-6">
                  {renderPersonCard(centralPerson, 'Personne Centrale')}
                  {spouse && (
                    <>
                      <div className="hidden md:flex items-center text-accent">
                        <FiHeart className="w-6 h-6 animate-pulse" />
                      </div>
                      {renderPersonCard(spouse, 'Conjoint(e)')}
                    </>
                  )}
                </div>
                {children.length > 0 && (
                  <div className="w-0.5 h-8 bg-primary/30 my-2"></div>
                )}
              </div>

              {/* Niveau Inférieur (Enfants) */}
              <div className="w-full flex flex-col items-center relative">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
                  Niveau Inférieur — Enfants ({children.length}) <FiArrowDown className="text-primary" />
                </div>
                {children.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-6">
                    {children.map(child => renderPersonCard(child, 'Enfant'))}
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
    </div>
  );
}

