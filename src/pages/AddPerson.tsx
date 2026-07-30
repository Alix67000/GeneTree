import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS, GENDER_OPTIONS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFamily } from '@/hooks/useFamily';
import { usePersons } from '@/hooks/usePersons';
import { Gender } from '@/types';

export function AddPerson() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { activeFamilyId } = useFamily();
  const { persons } = usePersons();
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'unknown' as Gender,
    birthDate: '',
    birthPlace: '',
    isLiving: true,
    deathDate: '',
    deathPlace: '',
    notes: '',
    parentId1: '',
    parentId2: '',
    spouseId: '',
  });

  useEffect(() => {
    if (isEditing && id) {
      const fetchPerson = async () => {
        try {
          const docRef = doc(db, COLLECTIONS.PERSONS, id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              gender: data.gender || 'unknown',
              birthDate: data.birthDate || '',
              birthPlace: data.birthPlace || '',
              isLiving: data.isLiving ?? true,
              deathDate: data.deathDate || '',
              deathPlace: data.deathPlace || '',
              notes: data.notes || '',
              parentId1: data.parentId1 || '',
              parentId2: data.parentId2 || '',
              spouseId: data.spouseId || '',
            });
          }
        } catch (err) {
          console.error('Error fetching person for edit:', err);
        }
      };
      fetchPerson();
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    // Handle both checkbox and text inputs appropriately
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setFormData(prev => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check for duplicates (same firstName, lastName case-insensitive, and birthDate)
    const duplicate = persons.find(p => 
      (!isEditing || p.id !== id) &&
      p.firstName.trim().toLowerCase() === formData.firstName.trim().toLowerCase() &&
      p.lastName.trim().toLowerCase() === formData.lastName.trim().toLowerCase() &&
      p.birthDate && formData.birthDate &&
      p.birthDate === formData.birthDate
    );

    if (duplicate) {
      const confirmed = window.confirm("Une personne portant ce nom et cette date de naissance existe déjà dans l'arbre. Voulez-vous vraiment continuer ?");
      if (!confirmed) return;
    }

    setLoading(true);
    
    try {
      if (isEditing && id) {
        const docRef = doc(db, COLLECTIONS.PERSONS, id);
        await updateDoc(docRef, {
          ...formData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Save new person to Firestore collection
        await addDoc(collection(db, COLLECTIONS.PERSONS), {
          ...formData,
          familyId: activeFamilyId || 'default_family', // Using a default if not set for demo
          createdAt: serverTimestamp(),
        });
      }
      // Navigate back to the tree view after successful save
      navigate('/tree');
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Failed to save person. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold text-text-primary">
          {isEditing ? 'Edit Person' : 'Add New Person'}
        </h1>
        <p className="text-text-secondary mt-1">
          {isEditing ? 'Update relative details in your family tree.' : 'Enter details to add a new relative to your family tree.'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">First Name *</label>
              <input 
                required
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Last Name *</label>
              <input 
                required
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Gender</label>
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            >
              {GENDER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Birth Date</label>
              <input 
                type="date" 
                name="birthDate" 
                value={formData.birthDate} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Birth Place</label>
              <input 
                type="text" 
                name="birthPlace" 
                value={formData.birthPlace} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input 
              type="checkbox" 
              name="isLiving" 
              id="isLiving"
              checked={formData.isLiving} 
              onChange={handleChange}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50"
            />
            <label htmlFor="isLiving" className="text-sm font-medium text-text-primary cursor-pointer">This person is living</label>
          </div>

          {!formData.isLiving && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/5 rounded-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Death Date</label>
                <input 
                  type="date" 
                  name="deathDate" 
                  value={formData.deathDate} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Death Place</label>
                <input 
                  type="text" 
                  name="deathPlace" 
                  value={formData.deathPlace} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Parent 1</label>
              <select 
                name="parentId1" 
                value={formData.parentId1} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="">None / Unknown</option>
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Parent 2</label>
              <select 
                name="parentId2" 
                value={formData.parentId2} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="">None / Unknown</option>
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Conjoint(e)</label>
              <select 
                name="spouseId" 
                value={formData.spouseId} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="">None / Unknown</option>
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Notes</label>
            <textarea 
              name="notes" 
              rows={4}
              value={formData.notes} 
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Add any biographical notes..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Person'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
