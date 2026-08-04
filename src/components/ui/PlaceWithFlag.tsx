import React from 'react';
import { COUNTRIES_WITH_FLAGS } from '@/lib/countries';

interface PlaceWithFlagProps {
  place?: string;
  className?: string;
}

export function PlaceWithFlag({ place, className = "" }: PlaceWithFlagProps) {
  if (!place || !place.trim()) return null;

  // Cherche quel pays est mentionné dans la chaîne de texte (ex: "Tehran, Iran" -> Iran / IR)
  const matchedCountry = COUNTRIES_WITH_FLAGS.find(c =>
    place.toLowerCase().includes(c.name.toLowerCase()) ||
    place.toLowerCase().includes(c.code.toLowerCase())
  );

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {matchedCountry && (
        <img
          src={`https://flagcdn.com/w20/${matchedCountry.code.toLowerCase()}.png`}
          alt={matchedCountry.name}
          className="w-4 h-3 object-cover rounded shadow-xs shrink-0 inline-block"
        />
      )}
      <span>{place}</span>
    </span>
  );
}
