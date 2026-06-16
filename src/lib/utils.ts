import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKm(km: number): string {
  return `${km.toFixed(km % 1 === 0 ? 0 : 1)} km`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelative(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function normalizeToYMD(input: string): string {
  if (!input) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);

  // Parse "MM/DD/YYYY HH:mm" or "MM/DD/YYYY"
  const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (match) {
    const [, m, d, y, hh = '00', mm = '00'] = match;

    let year = parseInt(y, 10);
    let month = parseInt(m, 10) - 1;
    let day = parseInt(d, 10);
    let hour = parseInt(hh, 10);
    const min = parseInt(mm, 10);

    // Fixed offset to map API venue local time to approximate Ljubljana "feeling" of the day.
    // US evening (high hour in local_date) becomes early morning next day in Europe.
    const OFFSET = 6;
    hour += OFFSET;

    if (hour >= 24) {
      hour -= 24;
      day += 1;
    }

    const adjusted = new Date(Date.UTC(year, month, day, hour, min));
    year = adjusted.getUTCFullYear();
    month = adjusted.getUTCMonth();
    day = adjusted.getUTCDate();

    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  try {
    const dt = new Date(input);
    if (!isNaN(dt.getTime())) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Ljubljana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(dt);
    }
  } catch {}
  return "";
}

export function formatShortDate(date: string): string {
  // Expects YYYY-MM-DD
  try {
    return format(new Date(date), "M/d");
  } catch {
    return date;
  }
}