import React, { useState, useMemo } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { Person } from '@/types';
import { getInitials } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { FiUser, FiCalendar, FiMapPin, FiInfo } from 'react-icons/fi';
import { renderGroupedPersonOptions } from '@/lib/personUtils';
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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#f4f7f6]">
      <div className="p-4 border-b border-border bg-white flex flex-col sm:flex-row gap-4 justify-between items-center z-10 shadow-sm">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">Family Passport</h2>
          <p className="text-xs text-text-secondary">Genealogical Identity & Lineage Branches</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeCenterId}
            onChange={(e) => setCenterId(e.target.value)}
            className="px-4 py-2.5 border border-border rounded-xl text-sm bg-surface min-w-[250px] shadow-sm focus:ring-2 focus:ring-primary/20 outline-none"
          >
            {renderGroupedPersonOptions(persons)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          
          {/* Identity Card (Passport) */}
          <div className="lg:w-[400px] flex-shrink-0">
            {centerPerson ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-border">
                <div className="bg-slate-800 p-6 text-center text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <FiMapPin className="w-24 h-24" />
                  </div>
                  <h3 className="text-xs font-bold tracking-widest uppercase opacity-70 mb-6">Genealogical Passport</h3>
                  <div className="w-32 h-32 mx-auto rounded-xl border-4 border-white/20 shadow-lg bg-surface flex items-center justify-center overflow-hidden mb-4 relative z-10">
                    {centerPerson.photoUrl ? (
                      <img src={centerPerson.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-slate-800 font-display font-bold">{getInitials(centerPerson.firstName, centerPerson.lastName)}</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-display font-bold">{centerPerson.firstName} {centerPerson.lastName}</h2>
                  {centerPerson.maidenName && (
                    <p className="text-sm opacity-80 mt-1">nee {centerPerson.maidenName}</p>
                  )}
                </div>
                
                <div className="p-6 space-y-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Age</label>
                      <p className="font-medium text-slate-800">
                        {calculateAge(centerPerson.birthDate, centerPerson.deathDate) ?? 'Unknown'}
                        {centerPerson.deathDate && ' (Deceased)'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender</label>
                      <p className="font-medium text-slate-800 capitalize">{centerPerson.gender || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="h-px w-full bg-slate-100"></div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <FiCalendar /> Date of Birth
                    </label>
                    <div className="mt-1">
                      <p className="text-sm font-semibold text-slate-800">{formatGregorian(centerPerson.birthDate) || 'Unknown'}</p>
                      {centerPerson.birthDate && (
                        <p className="text-xs text-slate-500 mt-0.5">{formatPersian(centerPerson.birthDate)} (Shamsi)</p>
                      )}
                    </div>
                  </div>

                  {centerPerson.birthPlace && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <FiMapPin /> Place of Birth
                      </label>
                      <p className="font-medium text-slate-800 mt-1">
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
                        <div className="mt-1">
                          <p className="text-sm font-semibold text-slate-800">{formatGregorian(centerPerson.deathDate)}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatPersian(centerPerson.deathDate)} (Shamsi)</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-text-secondary border border-border">
                No person selected.
              </div>
            )}
          </div>

          {/* Lineage & Branch Navigation */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 mb-6 bg-white rounded-t-2xl shadow-sm px-2 pt-2">
              <button
                onClick={() => setActiveTab('immediate')}
                className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'immediate' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Immediate Family ({immediate.length})
              </button>
              <button
                onClick={() => setActiveTab('paternal')}
                className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'paternal' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Paternal Lineage ({paternal.length})
              </button>
              <button
                onClick={() => setActiveTab('maternal')}
                className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'maternal' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Maternal Lineage ({maternal.length})
              </button>
              <button
                onClick={() => setActiveTab('inlaws')}
                className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'inlaws' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                In-Laws & Extended ({inlaws.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
              {getTabContent().map((rel, idx) => (
                <div key={`${rel.person.id}-${idx}`} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <div className="w-14 h-14 rounded-full bg-surface border-2 border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 text-slate-400 font-bold">
                    {rel.person.photoUrl ? (
                      <img src={rel.person.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(rel.person.firstName, rel.person.lastName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">{rel.title}</div>
                    <h4 className="font-display font-semibold text-slate-800 truncate">
                      {rel.person.firstName} {rel.person.lastName}
                    </h4>
                    {(rel.person.birthDate || rel.person.deathDate) && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {rel.person.birthDate ? new Date(rel.person.birthDate).getFullYear() : '?'} - {rel.person.deathDate ? new Date(rel.person.deathDate).getFullYear() : ''}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/person/${rel.person.id}`}
                    className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors"
                  >
                    <FiUser />
                  </Link>
                </div>
              ))}
              {getTabContent().length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                  <FiUser className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>No relatives found in this branch.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
