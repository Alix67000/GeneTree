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
    <div className="max-w-4xl mx-auto py-8 px-4 pb-20">
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-3xl font-display font-semibold text-text-primary">Chronologie</h1>
        <p className="text-text-secondary mt-2">Retrouvez tous les événements marquants de l'arbre au fil du temps.</p>
      </div>
      
      {events.length > 0 ? (
        <div className="relative border-l-2 border-slate-200 ml-4 md:mx-auto md:border-l-0">
          {/* Ligne centrale pour la version bureau */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2"></div>
          
          <div className="space-y-12">
            {events.map((evt, index) => {
              const isLeft = index % 2 === 0;
              const isBirth = evt.type === 'BIRTH';
              
              return (
                <div 
                  key={evt.id} 
                  className="relative flex items-center md:justify-between w-full group cursor-pointer"
                  onClick={() => navigate(`/person/${evt.person.id}`)}
                >
                  {/* Côté gauche (bureau) */}
                  <div className={`hidden md:block w-5/12 ${isLeft ? 'text-right pr-12' : 'order-last pl-12'}`}>
                    {isLeft && (
                      <Card className="p-5 hover:shadow-md transition-shadow">
                        <div className="text-sm text-text-secondary font-medium mb-1">
                          {formatDate(evt.dateStr)}
                        </div>
                        <div className="font-semibold text-text-primary text-lg">
                          {evt.person.firstName} {evt.person.lastName}
                        </div>
                        <div className="text-sm text-text-secondary mt-1">
                          {isBirth ? 'Naissance' : 'Décès'} {evt.location ? `à ${evt.location}` : ''}
                          {!isBirth && evt.person.birthDate && (
                            <span className="ml-1">
                              ({new Date(evt.dateStr).getFullYear() - new Date(evt.person.birthDate).getFullYear()} ans)
                            </span>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                  
                  {/* Icône centrale (bureau & mobile) */}
                  <div className="absolute left-[-22px] md:static md:left-auto md:translate-x-0 w-11 h-11 bg-white border-4 border-white rounded-full flex items-center justify-center z-10 shadow-sm mx-auto group-hover:scale-110 transition-transform">
                    {isBirth ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <FiUserPlus size={16} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <FiUserMinus size={16} />
                      </div>
                    )}
                  </div>
                  
                  {/* Côté droit (bureau) */}
                  <div className={`hidden md:block w-5/12 ${!isLeft ? 'text-left pl-12' : 'order-last pr-12'}`}>
                    {!isLeft && (
                      <Card className="p-5 hover:shadow-md transition-shadow">
                        <div className="text-sm text-text-secondary font-medium mb-1">
                          {formatDate(evt.dateStr)}
                        </div>
                        <div className="font-semibold text-text-primary text-lg">
                          {evt.person.firstName} {evt.person.lastName}
                        </div>
                        <div className="text-sm text-text-secondary mt-1">
                          {isBirth ? 'Naissance' : 'Décès'} {evt.location ? `à ${evt.location}` : ''}
                          {!isBirth && evt.person.birthDate && (
                            <span className="ml-1">
                              ({new Date(evt.dateStr).getFullYear() - new Date(evt.person.birthDate).getFullYear()} ans)
                            </span>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Carte mobile */}
                  <div className="md:hidden w-full pl-8 py-2">
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="text-sm text-text-secondary font-medium mb-1">
                        {formatDate(evt.dateStr)}
                      </div>
                      <div className="font-semibold text-text-primary text-base">
                        {evt.person.firstName} {evt.person.lastName}
                      </div>
                      <div className="text-sm text-text-secondary mt-1">
                        {isBirth ? 'Naissance' : 'Décès'} {evt.location ? `à ${evt.location}` : ''}
                        {!isBirth && evt.person.birthDate && (
                          <span className="ml-1">
                            ({new Date(evt.dateStr).getFullYear() - new Date(evt.person.birthDate).getFullYear()} ans)
                          </span>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              );
            })}
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
