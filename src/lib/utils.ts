import { format, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | undefined) {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    return String(dateString);
  }
}

export function getInitials(firstName?: string, lastName?: string) {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function formatPersonAge(birthDate?: string, deathDate?: string, isLiving = true): string {
  if (!birthDate) return '—';
  
  const birth = new Date(birthDate);
  const birthYear = birth.getFullYear();

  if (isNaN(birthYear)) return '—';

  if (isLiving) {
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    // If we only have the year, it could be less exact, but let's just stick to the calculation
    if (birthDate.length === 4) {
      return `Born ${birthYear} (~${age} yrs)`;
    }
    return `${age} yrs (born ${birthYear})`;
  } else {
    if (deathDate) {
      const death = new Date(deathDate);
      const deathYear = death.getFullYear();
      if (!isNaN(deathYear)) {
        let age = deathYear - birthYear;
        const m = death.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) {
          age--;
        }
        return `${birthYear} – ${deathYear} (${age} yrs)`;
      }
    }
    return `Born ${birthYear} (Deceased)`;
  }
}
