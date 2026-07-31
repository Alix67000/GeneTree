import * as jalaali from 'jalaali-js';

// Gregorian to Jalali (Shamsi)
export function gregorianToJalali(gy: number, gm: number, gd: number) {
  return jalaali.toJalaali(gy, gm, gd);
}

// Jalali (Shamsi) to Gregorian
export function jalaliToGregorian(jy: number, jm: number, jd: number) {
  return jalaali.toGregorian(jy, jm, jd);
}

export function toShamsiDateString(miladiDateStr: string): string {
  if (!miladiDateStr) return '';
  const dateObj = new Date(miladiDateStr);
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  if (year < 1 || year > 9999) return '';

  try {
    const { jy, jm, jd } = gregorianToJalali(
      year,
      dateObj.getMonth() + 1,
      dateObj.getDate()
    );
    return `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
  } catch (error) {
    return '';
  }
}

export function toMiladiDateString(shamsiDateStr: string): string {
  if (!shamsiDateStr) return '';
  
  // Accept both YYYY-MM-DD and YYYY/MM/DD formats
  const parts = shamsiDateStr.split(/[-/]/);
  if (parts.length !== 3) return '';
  
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);
  
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return '';
  if (jy < -61 || jy > 3177) return '';
  
  try {
    const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
    return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
  } catch (error) {
    return '';
  }
}

