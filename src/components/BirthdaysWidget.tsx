import React from 'react';
import { usePersons } from '@/hooks/usePersons';
import { Link } from 'react-router-dom';
import { getInitials } from '@/lib/utils';
import { FiGift } from 'react-icons/fi';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function BirthdaysWidget() {
  const { persons } = usePersons();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentMonthName = MONTH_NAMES[currentMonth - 1];

  const birthdayPersons = persons.filter(p => {
    if (p.isLiving === false) return false;
    if (!p.birthDate && !p.birthDateShamsi) return false;

    if (p.birthDate) {
      try {
        const parts = p.birthDate.split(/[-/]/);
        if (parts.length >= 2) {
          const monthNum = parseInt(parts[1], 10);
          if (monthNum === currentMonth) return true;
        }
      } catch (e) {}
    }

    if (p.birthDateShamsi) {
      try {
        const parts = p.birthDateShamsi.split(/[-/]/);
        if (parts.length >= 2) {
          const monthNum = parseInt(parts[1], 10);
          if (monthNum === currentMonth) return true;
        }
      } catch (e) {}
    }

    return false;
  });

  if (birthdayPersons.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-sm space-y-3 w-full">
      <div className="flex items-center gap-2 text-primary font-display font-semibold text-base">
        <FiGift className="w-5 h-5" />
        <span>Birthdays This Month 🎂 ({currentMonthName})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {birthdayPersons.map(p => (
          <Link
            key={p.id}
            to={`/person/${p.id}`}
            className="flex items-center gap-3 p-2.5 bg-background border border-border rounded-lg hover:border-primary transition-all group"
          >
            <div className="w-10 h-10 rounded-full border-2 border-accent bg-border flex items-center justify-center text-xs font-bold text-text-primary overflow-hidden shrink-0">
              {p.photoUrl ? (
                <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(p.firstName, p.lastName)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                {p.firstName} {p.lastName}
              </div>
              <div className="text-[11px] text-text-secondary truncate">
                {p.birthDate || p.birthDateShamsi}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
