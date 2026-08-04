import React, { useState, useEffect, useRef } from 'react';
import { COUNTRIES_WITH_FLAGS } from '@/lib/countries';

interface CountrySelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function CountrySelectWithFlags({ label, value, onChange, placeholder }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = COUNTRIES_WITH_FLAGS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  return (
    <div ref={containerRef} className="space-y-1 relative">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <input
        type="text"
        value={search}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        placeholder={placeholder || "e.g. Iran, France..."}
        className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm bg-background"
      />
      {isOpen && search.length >= 2 && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto z-50">
          {filtered.map(c => (
            <div
              key={c.code}
              onClick={() => {
                const fullText = `${c.name}`;
                setSearch(fullText);
                onChange(fullText);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-xs hover:bg-slate-100 cursor-pointer flex items-center gap-2 border-b border-border/40 last:border-0"
            >
              <img
                src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                alt={c.code}
                className="w-5 h-3.5 object-cover rounded shadow-sm shrink-0"
              />
              <span className="font-semibold text-text-primary">{c.name}</span>
              <span className="text-[10px] text-text-secondary ml-auto">{c.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
