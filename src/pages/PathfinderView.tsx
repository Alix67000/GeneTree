import React, { useState, useMemo } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { findKinshipPath } from '@/lib/kinship';
import { getInitials } from '@/lib/utils';
import { FiArrowRight, FiArrowDown } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export function PathfinderView() {
  const { persons } = usePersons();
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');

  // Default selections if empty and persons available
  const activeSourceId = sourceId || (persons.length > 0 ? persons[0].id : '');
  const activeTargetId = targetId || (persons.length > 1 ? persons[1].id : persons.length > 0 ? persons[0].id : '');

  const pathResult = useMemo(() => {
    if (!activeSourceId || !activeTargetId || persons.length === 0) return null;
    return findKinshipPath(activeSourceId, activeTargetId, persons);
  }, [activeSourceId, activeTargetId, persons]);

  const sourcePerson = persons.find(p => p.id === activeSourceId);
  const targetPerson = persons.find(p => p.id === activeTargetId);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="p-4 border-b border-border bg-surface flex flex-col md:flex-row gap-6 justify-between items-start md:items-center z-10 shadow-sm">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">Kinship Pathfinder</h2>
          <p className="text-xs text-text-secondary mt-1">Find the shortest relationship path between two family members.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] font-bold text-text-secondary uppercase mb-1">From (Start)</label>
            <select
              value={activeSourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background w-full sm:w-[200px]"
            >
              {persons.map(p => (
                <option key={`src-${p.id}`} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:flex text-text-secondary mt-4">
            <FiArrowRight />
          </div>
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] font-bold text-text-secondary uppercase mb-1">To (Target)</label>
            <select
              value={activeTargetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background w-full sm:w-[200px]"
            >
              {persons.map(p => (
                <option key={`tgt-${p.id}`} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc]">
        {pathResult && sourcePerson && targetPerson ? (
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg md:text-xl font-display font-medium text-text-primary">
                Calculated link: <span className="font-bold text-primary">{targetPerson.firstName}</span> is{' '}
                <span className="font-bold text-primary lowercase">{pathResult.title}</span> of{' '}
                <span className="font-bold text-primary">{sourcePerson.firstName}</span>
              </h3>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start md:overflow-x-auto pb-8 pt-4 px-4 md:snap-x md:snap-mandatory hide-scrollbar">
              {pathResult.steps.map((step, index) => {
                const isLast = index === pathResult.steps.length - 1;
                return (
                  <React.Fragment key={`${step.person.id}-${index}`}>
                    <div className="snap-center shrink-0 flex flex-col items-center">
                      <Link to={`/person/${step.person.id}`} className="group relative">
                        <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-4 shadow-md flex items-center justify-center text-3xl font-display font-semibold overflow-hidden transition-transform group-hover:scale-105 group-active:scale-95 ${
                          index === 0 ? 'border-emerald-500 text-emerald-700 bg-emerald-50' :
                          isLast ? 'border-primary text-primary-dark bg-primary/10' :
                          'border-white text-text-secondary bg-surface'
                        }`}>
                          {step.person.photoUrl ? (
                            <img src={step.person.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(step.person.firstName, step.person.lastName)
                          )}
                        </div>
                        <div className="mt-4 text-center w-36">
                          <h4 className="font-display font-bold text-sm text-text-primary line-clamp-2">
                            {step.person.firstName} {step.person.lastName}
                          </h4>
                          {(step.person.birthDate || step.person.deathDate) && (
                            <p className="text-[11px] text-text-secondary mt-1">
                              {step.person.birthDate ? new Date(step.person.birthDate).getFullYear() : '?'} -{' '}
                              {step.person.deathDate ? new Date(step.person.deathDate).getFullYear() : ''}
                            </p>
                          )}
                        </div>
                      </Link>
                    </div>

                    {!isLast && (
                      <div className="shrink-0 px-4 md:px-8 py-4 md:py-0 flex flex-col items-center justify-center md:-mt-16">
                        <div className="hidden md:flex items-center text-primary/60 animate-pulse">
                          <div className="h-0.5 w-8 md:w-16 bg-primary/40 rounded-full"></div>
                          <FiArrowRight className="w-6 h-6 -ml-2" />
                        </div>
                        <div className="flex md:hidden flex-col items-center text-primary/60 animate-pulse">
                          <div className="w-0.5 h-8 bg-primary/40 rounded-full"></div>
                          <FiArrowDown className="w-6 h-6 -mt-2" />
                        </div>
                        <div className="mt-2 bg-white border border-border px-3 py-1 rounded-full shadow-sm text-xs font-bold text-text-secondary whitespace-nowrap">
                          {pathResult.steps[index + 1].relationType}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-2">
              <FiArrowRight className="w-6 h-6 text-border" />
            </div>
            <p className="text-lg">Select two persons to calculate their kinship link.</p>
            {persons.length < 2 && (
              <p className="text-sm text-red-500">Add at least two persons to the tree.</p>
            )}
            {pathResult === null && persons.length >= 2 && activeSourceId && activeTargetId && (
              <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">No kinship link found between these two persons.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
