import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/services/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getInitials, formatPersonAge } from '@/lib/utils';
import { FiArrowLeft, FiUser, FiHeart, FiUsers, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Person } from '@/types';
import { PlaceWithFlag } from '@/components/ui/PlaceWithFlag';
import { usePersons } from '@/hooks/usePersons';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/lib/logger';

export function PersonDetail() {
  const { currentUser } = useAuth();
  const ADMIN_EMAIL = 'ahmadi67000@gmail.com';
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { persons } = usePersons();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleDelete = () => {
    if (!isAdmin) {
      alert("Access denied: Only the family administrator (Ali Ahmadi) can delete records.");
      return;
    }
    if (!id || !person) return;
    setShowDeleteModal(true);
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/20"></div></div>;
  if (!person) return <div className="text-center p-12"><p className="text-xl text-text-secondary">Person not found.</p></div>;

  const parent1 = persons.find(p => p.id === person.parentId1);
  const parent2 = persons.find(p => p.id === person.parentId2);
  const spouse = persons.find(p => p.id === person.spouseId);
  const children = persons.filter(p => p.parentId1 === person.id || p.parentId2 === person.id);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="pl-0 text-text-secondary hover:text-primary" onClick={() => navigate(-1)}>
          <FiArrowLeft className="mr-2" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Link to={`/person/edit/${id}`}>
            <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5 text-xs">
              <FiEdit2 className="w-3.5 h-3.5" /> Edit
            </Button>
          </Link>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={handleDelete} className="inline-flex items-center gap-1.5 text-xs text-error border-error/30 hover:bg-error/10">
              <FiTrash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          )}
        </div>
      </div>
      
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
              {formatPersonAge(person.birthDate, person.deathDate, person.isLiving)}
            </p>
            <div className="flex gap-2 mt-4 justify-center md:justify-start">
              <span className="px-2 py-1 bg-primary-light/10 text-primary text-[10px] font-bold rounded-full uppercase">{person.gender}</span>
              {person.isLiving && <span className="px-2 py-1 bg-accent/10 text-accent text-[10px] font-bold rounded-full uppercase">LIVING</span>}
            </div>
          </div>
          
          <div className="space-y-4 pt-6 border-t border-border mt-4 w-full">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-secondary text-xs uppercase tracking-widest font-medium">Born</span>
              <span className="text-sm font-semibold">{person.birthDate || 'Unknown'} {person.birthPlace && <><span className="mx-1">•</span><PlaceWithFlag place={person.birthPlace} /></>}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-secondary text-xs uppercase tracking-widest font-medium">Died</span>
              <span className="text-sm font-semibold">{person.deathDate || (person.isLiving ? 'Living' : 'Unknown')} {person.deathPlace && <><span className="mx-1">•</span><PlaceWithFlag place={person.deathPlace} /></>}</span>
            </div>
          </div>

          {/* Relationships section */}
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-sm font-semibold text-text-primary">Family Relationships</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-background/50 border border-border rounded-xl">
                <span className="text-xs text-text-secondary block font-medium">Parent 1</span>
                {parent1 ? (
                  <Link to={`/person/${parent1.id}`} className="text-primary font-semibold hover:underline flex items-center gap-1 mt-1">
                    <FiUser className="w-3.5 h-3.5" /> {parent1.firstName} {parent1.lastName}
                  </Link>
                ) : (
                  <span className="text-text-secondary/60 italic text-xs mt-1 block">Not specified</span>
                )}
              </div>

              <div className="p-3 bg-background/50 border border-border rounded-xl">
                <span className="text-xs text-text-secondary block font-medium">Parent 2</span>
                {parent2 ? (
                  <Link to={`/person/${parent2.id}`} className="text-primary font-semibold hover:underline flex items-center gap-1 mt-1">
                    <FiUser className="w-3.5 h-3.5" /> {parent2.firstName} {parent2.lastName}
                  </Link>
                ) : (
                  <span className="text-text-secondary/60 italic text-xs mt-1 block">Not specified</span>
                )}
              </div>

              <div className="p-3 bg-background/50 border border-border rounded-xl">
                <span className="text-xs text-text-secondary block font-medium">Spouse</span>
                {spouse ? (
                  <Link to={`/person/${spouse.id}`} className="text-primary font-semibold hover:underline flex items-center gap-1 mt-1">
                    <FiHeart className="w-3.5 h-3.5 text-accent" /> {spouse.firstName} {spouse.lastName}
                  </Link>
                ) : (
                  <span className="text-text-secondary/60 italic text-xs mt-1 block">Not specified</span>
                )}
              </div>
            </div>

            {/* Children list */}
            <div className="pt-3">
              <span className="text-xs text-text-secondary block font-medium mb-2">Children ({children.length})</span>
              {children.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {children.map(child => (
                    <Link 
                      key={child.id} 
                      to={`/person/${child.id}`}
                      className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <FiUsers className="w-3 h-3" /> {child.firstName} {child.lastName}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-secondary/60 italic">No children registered.</p>
              )}
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
      
      {showDeleteModal && person && id && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <h3 className="font-display text-lg font-bold text-text-primary">Delete Person</h3>
            <p className="text-sm text-text-secondary">
              Are you sure you want to permanently delete <strong>{person.firstName} {person.lastName}</strong> from the family tree? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  setShowDeleteModal(false);
                  try {
                    if (person.photoUrl) {
                      try {
                        const imageRef = ref(storage, person.photoUrl);
                        await deleteObject(imageRef);
                      } catch (e) {}
                    }
                    await deleteDoc(doc(db, COLLECTIONS.PERSONS, id));
                    logActivity('SUPPRESSION_PERSONNE', `Suppression de ${person.firstName} ${person.lastName}`, currentUser?.email || currentUser?.displayName || 'Inconnu');
                    navigate('/star-network');
                  } catch (err) {
                    console.error('Delete failed:', err);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
