// Small helpers for numbers and dates I use all over the screens.

export function parseNumber(text: string): number {
  // People here type "45,5" as often as "45.5", so I accept both
  const cleaned = text.trim().replace(/\s/g, '').replace(',', '.');
  if (cleaned === '') return NaN;
  return Number(cleaned);
}

export function formatNumber(value: number, digits = 0, locale = 'en'): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function todayString(): string {
  return toDateString(new Date());
}

export function endOfToday(): Date {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

export function yesterdayString(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toDateString(date);
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Parses 'YYYY-MM-DD' as a local date, returns null if it isn't a real day
export function parseDate(text: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
}

export function formatDate(text: string, locale = 'en'): string {
  const date = parseDate(text);
  if (!date) return text;
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function monthLabel(key: string, locale = 'en'): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

// 'morning' | 'afternoon' | 'evening' | 'night', for the little greeting on the home screen
export function partOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
