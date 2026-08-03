import React, { useState, useMemo } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { findKinshipPath } from '@/lib/kinship';
import { getInitials } from '@/lib/utils';
import { FiArrowRight, FiArrowDown } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { renderGroupedPersonOptions } from '@/lib/personUtils';

export function PathfinderView() {
  const { persons } = usePersons();
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');

  const activeSourceId = sourceId || (persons.length > 0 ? persons[0].id : '');
  const activeTargetId = targetId || (persons.length > 1 ? persons[1].id : persons.length > 0 ? persons[0].id : '');

  const pathResult = useMemo(() => {
    if (!activeSourceId || !activeTargetId || persons.length === 0) return null;
    return findKinshipPath(activeSourceId, activeTargetId, persons);
  }, [activeSourceId, activeTargetId, persons]);

  const sourcePerson = persons.find(p => p.id === activeSourceId);
  const targetPerson = persons.find(p => p.id === activeTargetId);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <div className="p-4 border-b border-border bg-surface flex flex-col md:flex-row gap-4 justify-between items-start md:items-center z-10 shadow-sm">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">Kinship Pathfinder</h2>
          <p className="text-xs text-text-secondary mt-0.5">Calculate the exact genealogical link and shortest path between two family members.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] font-bold text-text-secondary uppercase mb-1">From (Start Person)</label>
            <select
              value={activeSourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-xs bg-background w-full sm:w-[200px]"
            >
              {renderGroupedPersonOptions(persons)}
            </select>
          </div>
          <div className="hidden sm:flex text-text-secondary mt-5">
            <FiArrowRight />
          </div>
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] font-bold text-text-secondary uppercase mb-1">To (Target Person)</label>
            <select
              value={activeTargetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-xs bg-background w-full sm:w-[200px]"
            >
              {renderGroupedPersonOptions(persons)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 bg-[#f8fafc]">
        {pathResult && sourcePerson && targetPerson ? (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white border-2 border-primary/30 rounded-2xl p-5 text-center shadow-sm">
              <h3 className="text-base sm:text-lg md:text-xl font-display font-semibold text-text-primary">
                Relationship Result:{' '}
                <span className="font-bold text-primary">{targetPerson.firstName} {targetPerson.lastName}</span>
                {' '}is the{' '}
                <span className="font-bold text-primary uppercase underline underline-offset-4 decoration-primary/40">{pathResult.title}</span>
                {' '}of{' '}
                <span className="font-bold text-primary">{sourcePerson.firstName} {sourcePerson.lastName}</span>
              </h3>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 overflow-x-auto py-4 px-2">
              {pathResult.steps.map((step, index) => {
                const isLast = index === pathResult.steps.length - 1;
                const isFirst = index === 0;

                return (
                  <React.Fragment key={`${step.person.id}-${index}`}>
                    <Link
                      to={`/person/${step.person.id}`}
                      className={`w-64 md:w-56 p-4 bg-white rounded-2xl border-2 shadow-md hover:shadow-lg transition-all flex flex-col items-center text-center shrink-0 ${
                        isFirst
                          ? 'border-emerald-500 ring-4 ring-emerald-500/10'
                          : isLast
                          ? 'border-primary ring-4 ring-primary/10'
                          : 'border-border'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full border-2 border-accent bg-border shadow flex items-center justify-center text-base font-display font-semibold overflow-hidden">
                        {step.person.photoUrl ? (
                          <img src={step.person.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(step.person.firstName, step.person.lastName)
                        )}
                      </div>
                      <h4 className="font-display font-bold text-sm text-text-primary mt-2 truncate w-full">
                        {step.person.firstName} {step.person.lastName}
                      </h4>
                      {(step.person.birthDate || step.person.deathDate) && (
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {step.person.birthDate ? new Date(step.person.birthDate).getFullYear() : '?'} –{' '}
                          {step.person.deathDate ? new Date(step.person.deathDate).getFullYear() : 'Present'}
                        </p>
                      )}
                      <span className={`mt-3 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isFirst
                          ? 'bg-emerald-100 text-emerald-800'
                          : isLast
                          ? 'bg-primary/10 text-primary'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isFirst ? 'Start (From)' : isLast ? 'Target (To)' : `Step ${index}`}
                      </span>
                    </Link>

                    {!isLast && (
                      <div className="flex flex-col md:flex-row items-center justify-center gap-1 shrink-0 px-2 my-2 md:my-0">
                        <div className="hidden md:flex items-center text-primary/70">
                          <FiArrowRight className="w-5 h-5" />
                        </div>
                        <div className="flex md:hidden items-center text-primary/70">
                          <FiArrowDown className="w-5 h-5" />
                        </div>
                        <span className="bg-white border border-border px-3 py-1 rounded-full shadow-sm text-[11px] font-bold text-primary uppercase tracking-wide">
                          {pathResult.steps[index + 1].relationType}
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary space-y-3">
            <p className="text-base font-medium">Select two persons above to trace their relationship path.</p>
          </div>
        )}
      </div>
    </div>
  );
}
