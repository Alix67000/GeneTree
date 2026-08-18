import { COUNTRIES_WITH_FLAGS } from "@/lib/countries";
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/services/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AutocompletePerson } from '@/components/AutocompletePerson';
import { CountrySelectWithFlags } from '@/components/CountrySelectWithFlags';
import { useFamily } from '@/hooks/useFamily';
import { usePersons } from '@/hooks/usePersons';
import { Gender, Person } from '@/types';
import { compressAndResizeImage } from '@/lib/imageOptimizer';
import { toShamsiDateString, toMiladiDateString } from '@/lib/calendarUtils';
import { FiUpload, FiImage, FiX, FiCalendar } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/lib/logger';
import { renderGroupedPersonOptions } from '@/lib/personUtils';

const JALALI_MONTHS = [
  "Farvardin", "Ordibehesht", "Khordad",
  "Tir", "Mordad", "Shahrivar",
  "Mehr", "Aban", "Azar",
  "Dey", "Bahman", "Esfand"
];

function JalaliDatePicker({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState<number>(1370);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);

  // Initialize from value if present
  useEffect(() => {
    if (value && isOpen) {
      const parts = value.split(/[-/]/);
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y)) setSelectedYear(y);
        if (!isNaN(m)) setSelectedMonth(m);
      }
    }
  }, [value, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine days in month
  const getDaysInMonth = (year: number, month: number) => {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    // Simple leap year calculation for Jalali (33-year cycle approximation)
    const rem = year % 33;
    const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(rem);
    return isLeap ? 30 : 29;
  };

  const daysCount = getDaysInMonth(selectedYear, selectedMonth);
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);
  const yearsArray = Array.from({ length: 1406 - 1300 }, (_, i) => 1405 - i);

  return (
    <div className="relative space-y-2" ref={wrapperRef}>
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <div className="relative">
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button 
          type="button" 
          onClick={() => setIsOpen(!isOpen)} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
        >
          <FiCalendar size={18} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-[280px] bg-white border border-border rounded-xl shadow-xl p-4">
          <div className="flex gap-2 mb-4">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="flex-1 p-2 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              {JALALI_MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{i + 1}. {m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-24 p-2 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              {yearsArray.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  const formatted = `${selectedYear}/${String(selectedMonth).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
                  onChange(formatted);
                  setIsOpen(false);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const LOCAL_GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export function AddPerson() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { activeFamilyId } = useFamily();
  const { persons } = usePersons();
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'male' as Gender,
    birthDate: '',
    birthDateShamsi: '',
    birthPlace: '',
    isLiving: true,
    deathDate: '',
    deathDateShamsi: '',
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
              birthDateShamsi: data.birthDateShamsi || (data.birthDate ? toShamsiDateString(data.birthDate) : ''),
              birthPlace: data.birthPlace || '',
              isLiving: data.isLiving ?? true,
              deathDate: data.deathDate || '',
              deathDateShamsi: data.deathDateShamsi || (data.deathDate ? toShamsiDateString(data.deathDate) : ''),
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
    const target = e.target as HTMLInputElement;
    const rawValue = target.type === 'checkbox' ? target.checked : target.value;
    const value = target.name === 'lastName' && typeof rawValue === 'string' ? rawValue.toUpperCase() : rawValue;
    const name = target.name;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calculate Shamsi from Miladi
      if (name === 'birthDate') {
        newData.birthDateShamsi = typeof value === 'string' && value ? toShamsiDateString(value) : '';
      }
      if (name === 'deathDate') {
        newData.deathDateShamsi = typeof value === 'string' && value ? toShamsiDateString(value) : '';
      }
      
      // Auto-calculate Miladi from Shamsi
      if (name === 'birthDateShamsi') {
        newData.birthDate = typeof value === 'string' && value ? toMiladiDateString(value) : '';
      }
      if (name === 'deathDateShamsi') {
        newData.deathDate = typeof value === 'string' && value ? toMiladiDateString(value) : '';
      }

      return newData;
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setRawImageSrc(objectUrl);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setShowCropModal(true);
      e.target.value = '';
    }
  };

  const handleConfirmCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // La dimension de référence dans object-cover est le côté le plus court
    const minNaturalSize = Math.min(img.naturalWidth, img.naturalHeight);
    const scaleRatio = minNaturalSize / 256; // 1 pixel écran (256x256) en pixels réels
    const sSize = minNaturalSize / zoom;     // Taille réelle de la boîte de découpe

    // Calcul du centre exact décalé par offset en tenant compte du zoom actuel
    const sX = (img.naturalWidth - sSize) / 2 - (offset.x * scaleRatio) / zoom;
    const sY = (img.naturalHeight - sSize) / 2 - (offset.y * scaleRatio) / zoom;

    ctx.clearRect(0, 0, 600, 600);
    ctx.drawImage(img, sX, sY, sSize, sSize, 0, 0, 600, 600);

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'profile_cropped.webp', { type: 'image/webp' });
        setPhotoFile(croppedFile);
        setPhotoPreview(URL.createObjectURL(croppedFile));
      }
      setShowCropModal(false);
    }, 'image/webp', 0.8);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      const confirmed = window.confirm("A person with this name and birth date already exists in the tree. Do you want to continue?");
      if (!confirmed) return;
    }

    setLoading(true);
    
    try {
      let finalPhotoUrl = formData.photoUrl;

      if (typeof finalPhotoUrl === 'string' && finalPhotoUrl.startsWith('data:')) {
        finalPhotoUrl = '';
      }

      // Upload ONLY if photoFile !== null
      if (photoFile) {
        const uploadSingleAttempt = async (): Promise<string> => {
          const compressedBlob = await compressAndResizeImage(photoFile, 600, 0.7);
          const storageRef = ref(storage, `family_photos/${Date.now()}_${photoFile.name.replace(/\.[^/.]+$/, '')}.webp`);
          const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });

          return new Promise<string>((resolve, reject) => {
            const timer = setTimeout(() => {
              uploadTask.cancel();
              reject(new Error('Firebase Storage upload timed out after 30000ms'));
            }, 30000);

            uploadTask.on('state_changed', 
              (snapshot) => {
                setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
              },
              (error) => {
                clearTimeout(timer);
                reject(error);
              },
              () => {
                clearTimeout(timer);
                getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
              }
            );
          });
        };

        try {
          // First attempt
          finalPhotoUrl = await uploadSingleAttempt();
        } catch (err1) {
          console.warn('First photo upload attempt failed, retrying once...', err1);
          try {
            // Second attempt (retry once)
            finalPhotoUrl = await uploadSingleAttempt();
          } catch (err2) {
            console.error('Photo upload failed after retry:', err2);
            const prevUrl = formData.photoUrl;
            finalPhotoUrl = (typeof prevUrl === 'string' && (prevUrl.startsWith('http://') || prevUrl.startsWith('https://')))
              ? prevUrl
              : '';
            alert("Photo could not be uploaded. Person was saved without the new photo.");
          }
        }
      }

      // Sanitize before payload
      if (typeof finalPhotoUrl === 'string' && finalPhotoUrl.startsWith('data:')) {
        finalPhotoUrl = '';
      }

      const payload = {
        ...formData,
        photoUrl: finalPhotoUrl,
        familyId: activeFamilyId || 'default_family',
        updatedAt: serverTimestamp(),
      };

      if (isEditing && id) {
        const docRef = doc(db, COLLECTIONS.PERSONS, id);
        await updateDoc(docRef, payload); // Mise à jour instantanée en quelques millisecondes si photoFile est null
        logActivity('MODIFICATION_PERSONNE', `Modification de ${formData.firstName} ${formData.lastName}`, currentUser?.email || currentUser?.displayName || 'Inconnu');
      } else {
        await addDoc(collection(db, COLLECTIONS.PERSONS), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        logActivity('AJOUT_PERSONNE', `Ajout de ${formData.firstName} ${formData.lastName}`, currentUser?.email || currentUser?.displayName || 'Inconnu');
      }
      // Navigate back to the star network view after successful save
      navigate('/star-network');
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Failed to save person. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const uniqueFirstNames = Array.from(new Set(persons.map(p => p.firstName).filter(Boolean))).sort();
  const uniqueLastNames = Array.from(new Set(persons.map(p => p.lastName).filter(Boolean))).sort();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <datalist id="existing-firstnames">
        {formData.firstName.length >= 3 && uniqueFirstNames.map(name => <option key={name} value={name} />)}
      </datalist>
      <datalist id="existing-lastnames">
        {formData.lastName.length >= 3 && uniqueLastNames.map(name => <option key={name} value={name} />)}
      </datalist>
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
                list="existing-firstnames"
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
                list="existing-lastnames"
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
                <FiUpload /> Choose Photo & Crop
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
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
              {LOCAL_GENDER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Birth Date (Miladi)</label>
              <input 
                type="date" 
                name="birthDate" 
                value={formData.birthDate} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <JalaliDatePicker
              label="Birth Date (Shamsi / Jalali)"
              value={formData.birthDateShamsi}
              onChange={(val) => {
                setFormData(prev => ({
                  ...prev,
                  birthDateShamsi: val,
                  birthDate: val ? toMiladiDateString(val) : ''
                }));
              }}
              placeholder="YYYY/MM/DD"
            />
            <CountrySelectWithFlags
              label="Birth Place"
              value={formData.birthPlace}
              onChange={(val) => setFormData(prev => ({ ...prev, birthPlace: val }))}
              placeholder="e.g. Tehran, Iran / Paris, France"
            />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-black/5 rounded-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Death Date (Miladi)</label>
                <input 
                  type="date" 
                  name="deathDate" 
                  value={formData.deathDate} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <JalaliDatePicker
                label="Death Date (Shamsi)"
                value={formData.deathDateShamsi}
                onChange={(val) => {
                  setFormData(prev => ({
                    ...prev,
                    deathDateShamsi: val,
                    deathDate: val ? toMiladiDateString(val) : ''
                  }));
                }}
                placeholder="YYYY/MM/DD"
              />
              <CountrySelectWithFlags
                label="Death Place"
                value={formData.deathPlace}
                onChange={(val) => setFormData(prev => ({ ...prev, deathPlace: val }))}
                placeholder="e.g. Tehran, Iran / Paris, France"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
            <AutocompletePerson
              label="Father"
              valueId={formData.parentId1}
              onChange={(id, lastName) => {
                setFormData(prev => ({ ...prev, parentId1: id }));
                if (id && lastName && !formData.lastName) {
                   setFormData(prev => ({ ...prev, lastName: lastName.toUpperCase() }));
                }
              }}
              options={persons.filter(p => p.gender === 'male' && p.id !== id)}
              placeholder="Type at least 3 letters..."
            />
            <AutocompletePerson
              label="Mother"
              valueId={formData.parentId2}
              onChange={(id) => setFormData(prev => ({ ...prev, parentId2: id }))}
              options={persons.filter(p => p.gender === 'female' && p.id !== id)}
              placeholder="Type at least 3 letters..."
            />
            <AutocompletePerson
              label="Spouse"
              valueId={formData.spouseId}
              onChange={(id) => setFormData(prev => ({ ...prev, spouseId: id }))}
              options={persons.filter(p => (p.gender !== formData.gender || !p.gender) && p.id !== id)}
              placeholder="Type at least 3 letters..."
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

          <div className="pt-6 border-t border-border space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="w-full sm:w-1/3 h-12">Cancel</Button>
              <div className="flex-1 w-full relative">
                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold">
                  {loading ? 'Saving Person...' : 'Save Person'}
                </Button>
              </div>
            </div>
            {(loading || uploadProgress > 0) && (
              <div className="w-full space-y-1 text-center">
                <div className="text-xs font-semibold text-text-secondary">
                  {uploadProgress === 0 ? "Uploading photo..." : `Photo Upload: ${uploadProgress}%`}
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </form>
      </Card>

      {showCropModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center">
            <h3 className="font-display text-lg font-bold text-text-primary">Crop Profile Photo</h3>
            <p className="text-xs text-text-secondary">
              Adjust zoom and drag the image to center the face within the circle.
            </p>

            <div 
              className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-primary shadow-inner bg-black cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img
                  ref={imageRef}
                  src={rawImageSrc}
                  alt="Crop preview"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    maxHeight: 'none',
                    maxWidth: 'none',
                  }}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </div>
              <div className="absolute inset-0 border-2 border-white/50 rounded-full pointer-events-none"></div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-secondary font-medium">
                <span>Zoom (1x - 3x)</span>
                <span>{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCropModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmCrop}
                className="flex-1"
              >
                Confirm Crop
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
