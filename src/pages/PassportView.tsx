import React, { useState, useMemo, useEffect } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { Person } from '@/types';
import { getInitials } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { FiUser, FiCalendar, FiMapPin, FiInfo } from 'react-icons/fi';
import { PlaceWithFlag } from '@/components/ui/PlaceWithFlag';

interface GroupedRelative {
  person: Person;
  title: string;
}

export function PassportView() {
  const { persons } = usePersons();
  const [centerId, setCenterId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'immediate' | 'paternal' | 'maternal' | 'inlaws'>('immediate');

  const activeCenterId = centerId || (persons.length > 0 ? persons[0].id : '');
  const centerPerson = persons.find(p => p.id === activeCenterId);

  const [personQuery, setPersonQuery] = useState('');
  const [personListOpen, setPersonListOpen] = useState(false);

  useEffect(() => {
    if (!activeCenterId) { setPersonQuery(''); return; }
    const p = persons.find(x => x.id === activeCenterId);
    if (p) setPersonQuery(`${(p.lastName || '').toUpperCase()} ${p.firstName}`);
  }, [activeCenterId, persons]);

  const personSuggestions = useMemo(() => {
    if (personQuery.trim().length < 3) return [];
    const q = personQuery.toLowerCase();
    return [...persons]
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q))
      .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || ''));
  }, [personQuery, persons]);

  const getChildren = (id: string) => persons.filter(x => x.parentId1 === id || x.parentId2 === id);
  const getSpouses = (id: string) => {
    const person = persons.find(x => x.id === id);
    const spouses = persons.filter(x => x.spouseId === id);
    if (person?.spouseId) {
      const s = persons.find(x => x.id === person.spouseId);
      if (s && !spouses.some(x => x.id === s.id)) spouses.push(s);
    }
    return spouses;
  };
  const getParents = (id: string) => {
    const person = persons.find(x => x.id === id);
    return persons.filter(x => x.id === person?.parentId1 || x.id === person?.parentId2);
  };
  const getSiblings = (id: string) => {
    const person = persons.find(x => x.id === id);
    if (!person) return [];
    const parentIds = [person.parentId1, person.parentId2].filter(Boolean);
    if (parentIds.length === 0) return [];
    
    return persons.filter(x => x.id !== id && (
      (x.parentId1 && parentIds.includes(x.parentId1)) || 
      (x.parentId2 && parentIds.includes(x.parentId2))
    ));
  };

  const { immediate, paternal, maternal, inlaws } = useMemo(() => {
    if (!activeCenterId) return { immediate: [], paternal: [], maternal: [], inlaws: [] };

    const imm: GroupedRelative[] = [];
    getParents(activeCenterId).forEach(p => imm.push({ person: p, title: p.gender === 'male' ? 'Father' : p.gender === 'female' ? 'Mother' : 'Parent' }));
    getSpouses(activeCenterId).forEach(p => imm.push({ person: p, title: p.gender === 'male' ? 'Husband' : p.gender === 'female' ? 'Wife' : 'Spouse' }));
    getChildren(activeCenterId).forEach(p => imm.push({ person: p, title: p.gender === 'male' ? 'Son' : p.gender === 'female' ? 'Daughter' : 'Child' }));
    getSiblings(activeCenterId).forEach(p => imm.push({ person: p, title: p.gender === 'male' ? 'Brother' : p.gender === 'female' ? 'Sister' : 'Sibling' }));

    const pat: GroupedRelative[] = [];
    const parents = getParents(activeCenterId);
    const father = parents.find(p => p.gender === 'male') || parents[0];
    if (father && father.gender !== 'female') {
      getParents(father.id).forEach(p => pat.push({ person: p, title: p.gender === 'male' ? 'Paternal Grandfather' : p.gender === 'female' ? 'Paternal Grandmother' : 'Paternal Grandparent' }));
      const fatherSiblings = getSiblings(father.id);
      fatherSiblings.forEach(p => pat.push({ person: p, title: p.gender === 'male' ? 'Paternal Uncle' : p.gender === 'female' ? 'Paternal Aunt' : 'Paternal Uncle/Aunt' }));
      fatherSiblings.forEach(fs => {
        getChildren(fs.id).forEach(p => pat.push({ person: p, title: 'Paternal Cousin' }));
      });
    }

    const mat: GroupedRelative[] = [];
    const mother = parents.find(p => p.gender === 'female') || (parents.length > 1 ? parents[1] : null);
    if (mother && mother.gender !== 'male') {
      getParents(mother.id).forEach(p => mat.push({ person: p, title: p.gender === 'male' ? 'Maternal Grandfather' : p.gender === 'female' ? 'Maternal Grandmother' : 'Maternal Grandparent' }));
      const motherSiblings = getSiblings(mother.id);
      motherSiblings.forEach(p => mat.push({ person: p, title: p.gender === 'male' ? 'Maternal Uncle' : p.gender === 'female' ? 'Maternal Aunt' : 'Maternal Uncle/Aunt' }));
      motherSiblings.forEach(ms => {
        getChildren(ms.id).forEach(p => mat.push({ person: p, title: 'Maternal Cousin' }));
      });
    }

    const inlawList: GroupedRelative[] = [];
    getSpouses(activeCenterId).forEach(spouse => {
      getParents(spouse.id).forEach(p => inlawList.push({ person: p, title: p.gender === 'male' ? 'Father-in-law' : p.gender === 'female' ? 'Mother-in-law' : 'Parent-in-law' }));
      getSiblings(spouse.id).forEach(p => inlawList.push({ person: p, title: p.gender === 'male' ? 'Brother-in-law' : p.gender === 'female' ? 'Sister-in-law' : 'Sibling-in-law' }));
    });
    getChildren(activeCenterId).forEach(child => {
      getSpouses(child.id).forEach(p => inlawList.push({ person: p, title: p.gender === 'male' ? 'Son-in-law' : p.gender === 'female' ? 'Daughter-in-law' : 'Child-in-law' }));
    });

    const uniqueByPerson = (arr: GroupedRelative[]) => {
      const seen = new Set();
      return arr.filter(item => {
        if (seen.has(item.person.id)) return false;
        seen.add(item.person.id);
        return true;
      });
    };

    return {
      immediate: uniqueByPerson(imm),
      paternal: uniqueByPerson(pat),
      maternal: uniqueByPerson(mat),
      inlaws: uniqueByPerson(inlawList)
    };
  }, [activeCenterId, persons]);

  const calculateAge = (birth?: string, death?: string) => {
    if (!birth) return null;
    const end = death ? new Date(death) : new Date();
    const start = new Date(birth);
    let age = end.getFullYear() - start.getFullYear();
    const m = end.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < start.getDate())) {
      age--;
    }
    return age;
  };

  const formatGregorian = (dateString?: string) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
  };

  const formatPersian = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
    } catch (e) {
      return '';
    }
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'immediate': return immediate;
      case 'paternal': return paternal;
      case 'maternal': return maternal;
      case 'inlaws': return inlaws;
      default: return [];
    }
  };

  return (
    <div className="flex flex-col overflow-hidden overscroll-none bg-[#f4f7f6] -mx-2 -my-4 sm:-mx-4 md:-mx-8 h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)]">
      {/* Header ONE row */}
      <div className="px-2 py-1.5 md:px-4 md:py-2 border-b border-border bg-white flex flex-row items-center gap-2 shrink-0 z-10">
        <h2 className="text-sm md:text-xl font-display font-bold text-text-primary truncate shrink-0">Find your relative</h2>
        <div className="relative w-full min-w-0 flex-1">
          <input
            type="text"
            value={personQuery}
            onChange={(e) => { setPersonQuery(e.target.value); setPersonListOpen(true); }}
            onFocus={() => setPersonListOpen(true)}
            onBlur={() => setTimeout(() => setPersonListOpen(false), 200)}
            placeholder="Type 3 letters..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
          />
          {personListOpen && personQuery.trim().length >= 3 && personSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto">
              {personSuggestions.map(p => {
                const year = p.birthDate ? new Date(p.birthDate).getFullYear() : '?';
                return (
                  <button
                    type="button"
                    key={p.id}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs md:text-sm whitespace-nowrap truncate"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setCenterId(p.id); setPersonListOpen(false); }}
                  >
                    {(p.lastName || '').toUpperCase()} {p.firstName} ({year})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - No page scroll */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden p-2 md:p-4 lg:p-6 gap-3 md:gap-6">
        
        {/* Identity Card (Passport) */}
        <div className="shrink-0 lg:w-[340px] lg:overflow-y-auto">
          {centerPerson ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-border">
              {/* Header / Main identity section */}
              <div className="bg-slate-800 p-3 md:p-4 text-white relative overflow-hidden">
                <div className="hidden md:block absolute top-0 right-0 p-3 opacity-15">
                  <FiMapPin className="w-16 h-16" />
                </div>
                <h3 className="hidden md:block text-[10px] font-bold tracking-widest uppercase opacity-70 mb-3 text-center">Genealogical Passport</h3>
                
                {/* Horizontal on mobile, vertical centered on desktop */}
                <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2">
                  <div className="w-14 h-14 md:w-24 md:h-24 rounded-lg md:rounded-xl border-2 md:border-4 border-white/20 shadow-md bg-surface flex items-center justify-center overflow-hidden shrink-0 relative z-10">
                    {centerPerson.photoUrl ? (
                      <img src={centerPerson.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl md:text-3xl text-slate-800 font-display font-bold">{getInitials(centerPerson.firstName, centerPerson.lastName)}</span>
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1 md:text-center">
                    <h2 className="text-base md:text-xl font-display font-bold leading-tight truncate">
                      {centerPerson.firstName} {(centerPerson.lastName || '').toUpperCase()}
                    </h2>
                    {centerPerson.maidenName && (
                      <p className="text-xs opacity-80 italic truncate">nee {centerPerson.maidenName}</p>
                    )}
                    
                    {/* Quick info row on mobile */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] opacity-90 mt-0.5 md:hidden">
                      <span>Age: {calculateAge(centerPerson.birthDate, centerPerson.deathDate) ?? 'Unknown'}</span>
                      <span className="capitalize">• {centerPerson.gender || 'Unknown'}</span>
                      {centerPerson.birthDate && <span>• {formatGregorian(centerPerson.birthDate)}</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detailed info section on md+ */}
              <div className="hidden md:block p-4 space-y-3.5 bg-white text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Age</label>
                    <p className="font-medium text-slate-800 text-xs">
                      {calculateAge(centerPerson.birthDate, centerPerson.deathDate) ?? 'Unknown'}
                      {centerPerson.deathDate && ' (Deceased)'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender</label>
                    <p className="font-medium text-slate-800 capitalize text-xs">{centerPerson.gender || 'Unknown'}</p>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <FiCalendar /> Date of Birth
                  </label>
                  <div className="mt-0.5">
                    <p className="font-semibold text-slate-800">{formatGregorian(centerPerson.birthDate) || 'Unknown'}</p>
                    {centerPerson.birthDate && (
                      <p className="text-[11px] text-slate-500">{formatPersian(centerPerson.birthDate)} (Shamsi)</p>
                    )}
                  </div>
                </div>

                {centerPerson.birthPlace && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <FiMapPin /> Place of Birth
                    </label>
                    <p className="font-medium text-slate-800 mt-0.5">
                      <PlaceWithFlag place={centerPerson.birthPlace} />
                    </p>
                  </div>
                )}

                {centerPerson.deathDate && (
                  <>
                    <div className="h-px w-full bg-slate-100"></div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <FiInfo /> Date of Death
                      </label>
                      <div className="mt-0.5">
                        <p className="font-semibold text-slate-800">{formatGregorian(centerPerson.deathDate)}</p>
                        <p className="text-[11px] text-slate-500">{formatPersian(centerPerson.deathDate)} (Shamsi)</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-4 text-center text-xs text-text-secondary border border-border">
              No person selected.
            </div>
          )}
        </div>

        {/* Lineage & Branch Navigation */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Tabs header */}
          <div className="flex shrink-0 overflow-x-auto no-scrollbar border-b border-slate-200 bg-white rounded-t-xl px-1">
            <button
              onClick={() => setActiveTab('immediate')}
              className={`px-3 py-2.5 text-[11px] md:text-sm md:px-5 font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'immediate' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Family ({immediate.length})
            </button>
            <button
              onClick={() => setActiveTab('paternal')}
              className={`px-3 py-2.5 text-[11px] md:text-sm md:px-5 font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'paternal' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Paternal ({paternal.length})
            </button>
            <button
              onClick={() => setActiveTab('maternal')}
              className={`px-3 py-2.5 text-[11px] md:text-sm md:px-5 font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'maternal' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Maternal ({maternal.length})
            </button>
            <button
              onClick={() => setActiveTab('inlaws')}
              className={`px-3 py-2.5 text-[11px] md:text-sm md:px-5 font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'inlaws' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              In-laws ({inlaws.length})
            </button>
          </div>

          {/* Relatives list - ONLY this scrolls on mobile */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 md:p-4 bg-white/60 rounded-b-xl border border-t-0 border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {getTabContent().map((rel, idx) => (
                <div
                  key={`${rel.person.id}-${idx}`}
                  onClick={() => setCenterId(rel.person.id)}
                  className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-surface border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 text-slate-500 font-bold text-xs">
                    {rel.person.photoUrl ? (
                      <img src={rel.person.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(rel.person.firstName, rel.person.lastName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">{rel.title}</div>
                    <h4 className="font-display font-semibold text-slate-800 text-xs md:text-sm truncate">
                      {rel.person.firstName} {(rel.person.lastName || '').toUpperCase()}
                    </h4>
                    {(rel.person.birthDate || rel.person.deathDate) && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {rel.person.birthDate ? new Date(rel.person.birthDate).getFullYear() : '?'} - {rel.person.deathDate ? new Date(rel.person.deathDate).getFullYear() : ''}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/person/${rel.person.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0"
                    title="View Profile"
                  >
                    <FiUser size={14} />
                  </Link>
                </div>
              ))}
              {getTabContent().length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  <FiUser className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No relatives found in this branch.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
