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
    const utcMs = Date.UTC(
      parseInt(y, 10),
      parseInt(m, 10) - 1,
      parseInt(d, 10),
      parseInt(hh, 10),
      parseInt(mm, 10)
    );
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Ljubljana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(utcMs));
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