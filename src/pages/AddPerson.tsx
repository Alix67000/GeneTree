import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/services/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFamily } from '@/hooks/useFamily';
import { usePersons } from '@/hooks/usePersons';
import { Gender, Person } from '@/types';
import { compressAndResizeImage, blobToDataURL } from '@/lib/imageOptimizer';
import { FiUpload, FiImage, FiX } from 'react-icons/fi';

const LOCAL_GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Masculin (Male)' },
  { value: 'female', label: 'Féminin (Female)' },
];

function PersonAutocomplete({ 
  label, 
  value, 
  options, 
  onChange 
}: { 
  label: string; 
  value: string; 
  options: Person[]; 
  onChange: (val: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Sync search with selected value
  useEffect(() => {
    if (value) {
      const selected = options.find(o => o.id === value);
      if (selected) {
        setSearch(`${selected.firstName} ${selected.lastName}`);
      } else {
        setSearch('');
      }
    } else {
      setSearch('');
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = search.length >= 3 
    ? options.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="relative space-y-2" ref={wrapperRef}>
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <div className="relative">
        <input 
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') onChange('');
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Taper 3 lettres..."
          className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {value && (
           <button 
             type="button" 
             onClick={(e) => { e.stopPropagation(); onChange(''); }} 
             className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
           >
             <FiX size={14} />
           </button>
        )}
      </div>
      
      {isOpen && search.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(p => (
              <div 
                key={p.id}
                onClick={() => {
                  onChange(p.id);
                  setIsOpen(false);
                }}
                className="px-4 py-2 cursor-pointer hover:bg-primary/5 text-sm font-medium"
              >
                {p.firstName} {p.lastName} {p.birthDate ? `(${new Date(p.birthDate).getFullYear()})` : ''}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-text-secondary">Aucun membre trouvé</div>
          )}
        </div>
      )}
    </div>
  );
}

export function AddPerson() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { activeFamilyId } = useFamily();
  const { persons } = usePersons();
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'male' as Gender,
    birthDate: '',
    birthPlace: '',
    isLiving: true,
    deathDate: '',
    deathPlace: '',
    notes: '',
    parentId1: '',
    parentId2: '',
    spouseId: '',
    photoUrl: '',
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
              photoUrl: data.photoUrl || '',
            });
            if (data.photoUrl) {
              setPhotoPreview(data.photoUrl);
            }
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
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
      let finalPhotoUrl = formData.photoUrl;

      if (photoFile) {
        try {
          // Compress and resize image to WebP
          const compressedBlob = await compressAndResizeImage(photoFile, 600, 0.7);
          const storageRef = ref(storage, `family_photos/${Date.now()}_${photoFile.name.replace(/\.[^/.]+$/, '')}.webp`);
          
          const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });
          
          const downloadUrl = await new Promise<string>((resolve, reject) => {
            uploadTask.on('state_changed', 
              (snapshot) => {
                setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
              },
              (error) => reject(error),
              () => {
                getDownloadURL(uploadTask.snapshot.ref).then(resolve);
              }
            );
          });
          finalPhotoUrl = downloadUrl;
        } catch (uploadError: any) {
          console.error('Photo upload error or timeout, falling back to local Base64 WebP:', uploadError);
          try {
            const compressedBlob = await compressAndResizeImage(photoFile, 600, 0.7);
            finalPhotoUrl = await blobToDataURL(compressedBlob);
          } catch (fallbackErr) {
            console.error('Fallback Base64 conversion failed:', fallbackErr);
            const proceedWithoutPhoto = window.confirm(
              "Erreur d'envoi de la photo : Firebase Storage indisponible. Voulez-vous enregistrer la fiche sans la photo ?"
            );
            if (!proceedWithoutPhoto) {
              setLoading(false);
              return;
            }
            finalPhotoUrl = formData.photoUrl;
          }
        }
      }

      const payload = {
        ...formData,
        photoUrl: finalPhotoUrl,
        familyId: activeFamilyId || 'default_family',
        updatedAt: serverTimestamp(),
      };

      if (isEditing && id) {
        const docRef = doc(db, COLLECTIONS.PERSONS, id);
        await updateDoc(docRef, payload);
      } else {
        await addDoc(collection(db, COLLECTIONS.PERSONS), {
          ...payload,
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
            <label className="text-sm font-medium text-text-primary">Profile Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-accent bg-border flex items-center justify-center overflow-hidden text-text-secondary">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FiImage size={24} />
                )}
              </div>
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border rounded-[var(--radius-button)] cursor-pointer hover:border-primary/50 transition-colors bg-background/50 text-sm font-medium text-text-secondary hover:text-primary">
                <FiUpload /> Choose Photo (Auto WebP compression)
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-1">
                <div className="text-xs text-text-secondary">Upload en cours : {uploadProgress}%...</div>
                <div className="w-full bg-gray-200 h-2 rounded">
                  <div className="bg-primary h-2 rounded" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Gender</label>
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            >
              {LOCAL_GENDER_OPTIONS.map(opt => (
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
            <PersonAutocomplete 
              label="Père (Father)"
              value={formData.parentId1}
              options={persons.filter(p => p.gender === 'male' && p.id !== id)}
              onChange={(val) => {
                setFormData(prev => ({ ...prev, parentId1: val }));
                if (val && !formData.lastName) {
                   const father = persons.find(p => p.id === val);
                   if (father && father.lastName) {
                      setFormData(prev => ({ ...prev, lastName: father.lastName }));
                   }
                }
              }}
            />
            <PersonAutocomplete 
              label="Mère (Mother)"
              value={formData.parentId2}
              options={persons.filter(p => p.gender === 'female' && p.id !== id)}
              onChange={(val) => setFormData(prev => ({ ...prev, parentId2: val }))}
            />
            <PersonAutocomplete 
              label="Conjoint(e)"
              value={formData.spouseId}
              options={persons.filter(p => (p.gender !== formData.gender || !p.gender) && p.id !== id)}
              onChange={(val) => setFormData(prev => ({ ...prev, spouseId: val }))}
            />
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
