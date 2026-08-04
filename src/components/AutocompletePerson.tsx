import React, { useState, useEffect, useMemo } from 'react';
import { Person } from '@/types';

export const AutocompletePerson = ({ 
  label, 
  valueId, 
  onChange, 
  options, 
  placeholder 
}: { 
  label: string, 
  valueId: string, 
  onChange: (id: string, lastName?: string) => void, 
  options: Person[],
  placeholder: string
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (valueId) {
      const p = options.find(o => o.id === valueId);
      if (p) {
        setSearchTerm(`${(p.lastName || '').toUpperCase()} ${p.firstName}`);
      }
    } else {
      setSearchTerm('');
    }
  }, [valueId, options]);

  const filteredOptions = useMemo(() => {
    if (searchTerm.length < 3) return [];
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter(p => {
       const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
       return fullName.includes(lowerSearch);
    });
  }, [searchTerm, options]);

  const handleSelect = (p: Person) => {
    onChange(p.id, p.lastName);
    setSearchTerm(`${(p.lastName || '').toUpperCase()} ${p.firstName}`);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <input 
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          if (e.target.value === '') {
             onChange('');
          }
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
      />
      {isOpen && searchTerm.length >= 3 && filteredOptions.length > 0 && (
        <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {filteredOptions.map(p => {
             const birthYear = p.birthDate ? new Date(p.birthDate).getFullYear() : '?';
             return (
               <div 
                 key={p.id} 
                 className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                 onClick={() => handleSelect(p)}
               >
                 {(p.lastName || '').toUpperCase()} {p.firstName} ({birthYear})
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
};
