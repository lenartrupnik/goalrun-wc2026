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
  const datePart = input.split(" ")[0];
  const parts = datePart.split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  try {
    const dt = new Date(input);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
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