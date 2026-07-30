import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { COLLECTIONS } from '../lib/constants';
import { useFamily } from './useFamily';

export function usePersons() {
  const { activeFamilyId } = useFamily();
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const personsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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
