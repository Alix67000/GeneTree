import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, QuerySnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { useFamily } from './useFamily';
import { Person } from '@/types';

export function usePersons() {
  const { activeFamilyId } = useFamily();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!activeFamilyId) {
      setPersons([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.PERSONS),
      where('familyId', '==', activeFamilyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      const personsData = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      })) as Person[];
      setPersons(personsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching persons:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [activeFamilyId]);

  return { persons, loading };
}
