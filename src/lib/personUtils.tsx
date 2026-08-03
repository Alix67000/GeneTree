import React from 'react';
import { Person } from '@/types';

export function renderGroupedPersonOptions(persons: Person[]) {
  // Sort persons alphabetically by lastName, then firstName
  const sorted = [...persons].sort((a, b) => {
    const cmp = (a.lastName || '').localeCompare(b.lastName || '');
    return cmp !== 0 ? cmp : (a.firstName || '').localeCompare(b.firstName || '');
  });

  // Group by uppercase lastName
  const groups = new Map<string, Person[]>();
  sorted.forEach(p => {
    const familyName = (p.lastName || 'OTHER').toUpperCase().trim();
    if (!groups.has(familyName)) groups.set(familyName, []);
    groups.get(familyName)!.push(p);
  });

  return Array.from(groups.entries()).map(([familyName, members]) => (
    <optgroup key={familyName} label={`— ${familyName} —`}>
      {members.map(m => (
        <option key={m.id} value={m.id}>
          {(m.lastName || '').toUpperCase()} {m.firstName} {m.birthDate ? `(${new Date(m.birthDate).getFullYear()})` : ''}
        </option>
      ))}
    </optgroup>
  ));
}
