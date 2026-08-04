import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersons } from '@/hooks/usePersons';
import { getInitials } from '@/lib/utils';
import { FiUserPlus, FiUserMinus } from 'react-icons/fi';
import { Person } from '@/types';

type TimelineEvent = {
  id: string;
  type: 'BIRTH' | 'DEATH';
  dateStr: string;
  dateObj: Date;
  year: number;
  person: Person;
  location?: string;
};

export function Timeline() {
  const { persons } = usePersons();
  const navigate = useNavigate();

  const events = useMemo(() => {
    const list: TimelineEvent[] = [];
    persons.forEach(person => {
      if (person.birthDate) {
        const d = new Date(person.birthDate);
        if (!isNaN(d.getFullYear())) {
          list.push({
            id: `${person.id}-birth`,
            type: 'BIRTH',
            dateStr: person.birthDate,
            dateObj: d,
            year: d.getFullYear(),
            person,
            location: person.birthPlace,
          });
        }
      }
      if (!person.isLiving && person.deathDate) {
        const d = new Date(person.deathDate);
        if (!isNaN(d.getFullYear())) {
          list.push({
            id: `${person.id}-death`,
            type: 'DEATH',
            dateStr: person.deathDate,
            dateObj: d,
            year: d.getFullYear(),
            person,
            location: person.deathPlace,
          });
        }
      }
    });

    return list.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [persons]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <div className="p-4 border-b border-border bg-surface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-sm z-10">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">Family Heritage Timeline</h2>
          <p className="text-xs text-text-secondary mt-0.5">Chronological history of births and memorials across generations.</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
          {events.length} Historical Events
        </div>
      </div>

      <div className="flex-1 relative flex items-center overflow-x-auto py-12 px-6 bg-[#f8fafc] hide-scrollbar select-none">
        {events.length === 0 ? (
          <div className="w-full text-center text-text-secondary py-12 text-sm">
            No historical dates recorded. Add birth or death dates to family members to populate the timeline.
          </div>
        ) : (
          <div className="relative flex items-center min-w-max mx-auto py-8">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-border via-primary/30 to-border"></div>

            {events.map((evt, index) => {
              const isTop = index % 2 === 0;
              const isBirth = evt.type === 'BIRTH';
              const showYear = index === 0 || events[index - 1].year !== evt.year;

              return (
                <React.Fragment key={evt.id}>
                  {showYear && (
                    <div className="relative z-10 mx-3 bg-primary text-white font-bold px-3 py-1 rounded-full text-xs shadow shrink-0">
                      {evt.year}
                    </div>
                  )}

                  <div
                    onClick={() => navigate(`/person/${evt.person.id}`)}
                    className="relative flex flex-col items-center justify-center group cursor-pointer w-48 sm:w-52 shrink-0 h-[260px] mx-2"
                  >
                    <div className="flex-1 w-full flex flex-col justify-end pb-2 relative">
                      {isTop && (
                        <div className="flex flex-col items-center w-full">
                          <div className="p-3 bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all w-full text-center relative z-10 group-hover:border-primary/50">
                            <div className="flex items-center justify-center gap-2 mb-1.5">
                              <div className="w-8 h-8 rounded-full border border-accent bg-border overflow-hidden flex items-center justify-center text-[10px] font-bold">
                                {evt.person.photoUrl ? (
                                  <img src={evt.person.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  getInitials(evt.person.firstName, evt.person.lastName)
                                )}
                              </div>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                isBirth ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {isBirth ? 'BORN' : 'DIED'}
                              </span>
                            </div>
                            <h4 className="font-display font-bold text-xs text-text-primary truncate">
                              {evt.person.firstName} {evt.person.lastName}
                            </h4>
                            <p className="text-[10px] text-text-secondary mt-0.5 truncate">
                              {evt.year} {evt.location ? `• ${evt.location}` : ''}
                            </p>
                          </div>
                          <div className="w-0.5 h-6 bg-slate-300 group-hover:bg-primary transition-colors"></div>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-9 h-9 bg-white border-2 border-white rounded-full flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                        {isBirth ? (
                          <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <FiUserPlus size={14} />
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <FiUserMinus size={14} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col justify-start pt-2 relative">
                      {!isTop && (
                        <div className="flex flex-col items-center w-full">
                          <div className="w-0.5 h-6 bg-slate-300 group-hover:bg-primary transition-colors"></div>
                          <div className="p-3 bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all w-full text-center relative z-10 group-hover:border-primary/50">
                            <div className="flex items-center justify-center gap-2 mb-1.5">
                              <div className="w-8 h-8 rounded-full border border-accent bg-border overflow-hidden flex items-center justify-center text-[10px] font-bold">
                                {evt.person.photoUrl ? (
                                  <img src={evt.person.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  getInitials(evt.person.firstName, evt.person.lastName)
                                )}
                              </div>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                isBirth ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {isBirth ? 'BORN' : 'DIED'}
                              </span>
                            </div>
                            <h4 className="font-display font-bold text-xs text-text-primary truncate">
                              {evt.person.firstName} {evt.person.lastName}
                            </h4>
                            <p className="text-[10px] text-text-secondary mt-0.5 truncate">
                              {evt.year} {evt.location ? `• ${evt.location}` : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
