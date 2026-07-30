import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getInitials } from '@/lib/utils';
import { FiArrowLeft } from 'react-icons/fi';
import { Person } from '@/types';

export function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPerson = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, COLLECTIONS.PERSONS, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPerson({ id: docSnap.id, ...docSnap.data() } as Person);
        }
      } catch (error) {
        console.error("Error fetching person:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerson();
  }, [id]);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/20"></div></div>;
  if (!person) return <div className="text-center p-12"><p className="text-xl text-text-secondary">Person not found.</p></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" className="pl-0 text-text-secondary hover:text-primary" onClick={() => navigate(-1)}>
        <FiArrowLeft className="mr-2" /> Back
      </Button>
      
      <Card className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10"></div>
        <div className="w-32 h-32 flex-shrink-0 rounded-full border-2 border-accent bg-border ring-4 ring-white shadow-lg flex items-center justify-center text-4xl font-display font-medium text-text-primary overflow-hidden">
          {person.photoUrl ? (
            <img src={person.photoUrl} alt={`${person.firstName} ${person.lastName}`} className="w-full h-full object-cover" />
          ) : (
            getInitials(person.firstName, person.lastName)
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-4 w-full">
          <div>
            <h1 className="text-4xl font-display font-semibold text-text-primary">{person.firstName} {person.lastName}</h1>
            <p className="text-sm text-text-secondary mt-2 italic">
              {person.birthDate ? new Date(person.birthDate).getFullYear() : 'Unknown'} — {person.deathDate ? new Date(person.deathDate).getFullYear() : (person.isLiving ? 'Present' : 'Unknown')}
            </p>
            <div className="flex gap-2 mt-4 justify-center md:justify-start">
              <span className="px-2 py-1 bg-primary-light/10 text-primary text-[10px] font-bold rounded-full uppercase">{person.gender}</span>
              {person.isLiving && <span className="px-2 py-1 bg-accent/10 text-accent text-[10px] font-bold rounded-full uppercase">LIVING</span>}
            </div>
          </div>
          
          <div className="space-y-4 pt-6 border-t border-border mt-4 w-full">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-secondary text-xs uppercase tracking-widest font-medium">Born</span>
              <span className="text-sm font-semibold">{person.birthDate || 'Unknown'} {person.birthPlace && `• ${person.birthPlace}`}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-secondary text-xs uppercase tracking-widest font-medium">Died</span>
              <span className="text-sm font-semibold">{person.deathDate || (person.isLiving ? 'Living' : 'Unknown')} {person.deathPlace && `• ${person.deathPlace}`}</span>
            </div>
          </div>

          {person.notes && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Notes</p>
              <p className="text-text-primary whitespace-pre-wrap">{person.notes}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
