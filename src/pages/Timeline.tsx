import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersons } from '@/hooks/usePersons';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { FiUserPlus, FiUserMinus, FiClock } from 'react-icons/fi';
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
            location: person.birthPlace
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
            location: person.deathPlace
          });
        }
      }
    });

    list.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    return list;
  }, [persons]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 pb-20">
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-3xl font-display font-semibold text-text-primary">Chronologie</h1>
        <p className="text-text-secondary mt-2">Retrouvez tous les événements marquants de l'arbre au fil du temps.</p>
      </div>
      
      {events.length > 0 ? (
        <div className="relative w-full">
          <div className="overflow-x-auto pb-12 pt-4 flex items-center snap-x hide-scrollbar">
            <div className="relative flex items-center min-w-max px-8 py-8">
              {/* Ligne horizontale centrale continue */}
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
              
              {events.map((evt, index) => {
                const isTop = index % 2 === 0;
                const isBirth = evt.type === 'BIRTH';
                const showYear = index === 0 || events[index - 1].year !== evt.year;
                
                return (
                  <React.Fragment key={evt.id}>
                    {showYear && (
                      <div className="relative z-10 mx-6 bg-slate-100 border border-slate-200 text-slate-500 font-bold px-4 py-1.5 rounded-full text-sm shadow-sm shrink-0">
                        {evt.year}
                      </div>
                    )}
                    
                    <div 
                      className="relative flex flex-col items-center justify-center group cursor-pointer w-72 shrink-0 h-[400px] mx-4 snap-center"
                      onClick={() => navigate(`/person/${evt.person.id}`)}
                    >
                      {/* Partie Supérieure */}
                      <div className="flex-1 w-full flex flex-col justify-end pb-1 relative">
                        {isTop && (
                          <div className="flex flex-col items-center w-full">
                            <Card className="p-5 hover:shadow-md transition-shadow relative z-10 w-full mb-0">
                              <div className="text-sm text-text-secondary font-medium mb-1">
                                {formatDate(evt.dateStr)}
                              </div>
                              <div className="font-semibold text-text-primary text-lg truncate">
                                {evt.person.firstName} {evt.person.lastName}
                              </div>
                              <div className="text-sm text-text-secondary mt-1 truncate">
                                {isBirth ? 'Naissance' : 'Décès'} {evt.location ? `à ${evt.location}` : ''}
                                {!isBirth && evt.person.birthDate && (
                                  <span className="ml-1">
                                    ({new Date(evt.dateStr).getFullYear() - new Date(evt.person.birthDate).getFullYear()} ans)
                                  </span>
                                )}
                              </div>
                            </Card>
                            <div className="w-0.5 h-8 bg-slate-300 group-hover:bg-primary/50 transition-colors"></div>
                          </div>
                        )}
                      </div>

                      {/* Icône Centrale */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-12 h-12 bg-white border-4 border-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 ring-2 ring-transparent group-hover:ring-primary/20">
                          {isBirth ? (
                            <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                              <FiUserPlus size={18} />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <FiUserMinus size={18} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Partie Inférieure */}
                      <div className="flex-1 w-full flex flex-col justify-start pt-1 relative">
                        {!isTop && (
                          <div className="flex flex-col items-center w-full">
                            <div className="w-0.5 h-8 bg-slate-300 group-hover:bg-primary/50 transition-colors"></div>
                            <Card className="p-5 hover:shadow-md transition-shadow relative z-10 w-full mt-0">
                              <div className="text-sm text-text-secondary font-medium mb-1">
                                {formatDate(evt.dateStr)}
                              </div>
                              <div className="font-semibold text-text-primary text-lg truncate">
                                {evt.person.firstName} {evt.person.lastName}
                              </div>
                              <div className="text-sm text-text-secondary mt-1 truncate">
                                {isBirth ? 'Naissance' : 'Décès'} {evt.location ? `à ${evt.location}` : ''}
                                {!isBirth && evt.person.birthDate && (
                                  <span className="ml-1">
                                    ({new Date(evt.dateStr).getFullYear() - new Date(evt.person.birthDate).getFullYear()} ans)
                                  </span>
                                )}
                              </div>
                            </Card>
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <Card className="text-center py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-4">
            <FiClock size={32} />
          </div>
          <h2 className="text-xl font-display font-medium text-text-primary">Aucun événement à afficher</h2>
          <p className="text-text-secondary max-w-md">
            Ajoutez des dates de naissance ou de décès aux membres de votre famille pour voir la chronologie se construire.
          </p>
        </Card>
      )}
    </div>
  );
}
