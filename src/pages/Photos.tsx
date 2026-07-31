import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersons } from '@/hooks/usePersons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiImage, FiX, FiUser } from 'react-icons/fi';
import { Person } from '@/types';
import { formatPersonAge } from '@/lib/utils';

export function Photos() {
  const { persons } = usePersons();
  const navigate = useNavigate();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const personsWithPhotos = persons.filter(p => p.photoUrl && p.photoUrl.trim() !== '');

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-display font-semibold text-text-primary">Galerie de la famille</h1>
        <p className="text-text-secondary mt-1">Les visages qui composent votre arbre généalogique.</p>
      </div>

      {personsWithPhotos.length === 0 ? (
        <Card className="text-center py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-4">
            <FiImage size={24} />
          </div>
          <h2 className="text-xl font-display font-medium text-text-primary">Aucune photo pour le moment</h2>
          <p className="text-text-secondary max-w-md">
            Ajoutez des photos sur les profils des membres de votre famille pour les voir apparaître ici.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {personsWithPhotos.map(person => (
            <Card 
              key={person.id} 
              className="overflow-hidden cursor-pointer group hover:shadow-md transition-shadow duration-200"
              onClick={() => setSelectedPerson(person)}
            >
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                <img 
                  src={person.photoUrl!} 
                  alt={`${person.firstName} ${person.lastName}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-text-primary truncate">
                  {person.firstName} {person.lastName}
                </h3>
                <p className="text-sm text-text-secondary truncate">
                  {formatPersonAge(person.birthDate, person.deathDate, person.isLiving)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedPerson(null)}>
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPerson(null);
            }}
          >
            <FiX size={32} />
          </button>
          
          <div 
            className="max-w-4xl w-full flex flex-col md:flex-row bg-surface rounded-2xl overflow-hidden shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:w-2/3 bg-black flex items-center justify-center min-h-[50vh]">
              <img 
                src={selectedPerson.photoUrl!} 
                alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`} 
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            <div className="md:w-1/3 p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
                {selectedPerson.firstName} {selectedPerson.lastName}
              </h2>
              <p className="text-text-secondary mb-6 text-lg">
                {formatPersonAge(selectedPerson.birthDate, selectedPerson.deathDate, selectedPerson.isLiving)}
              </p>
              
              <Button 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  setSelectedPerson(null);
                  navigate(`/person/${selectedPerson.id}`);
                }}
              >
                <FiUser />
                Voir la fiche
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
