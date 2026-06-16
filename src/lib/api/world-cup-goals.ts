import { WORLDCUP_API_URL } from "@/lib/constants";
import type { DailyGoal, WorldCupGamesResponse } from "@/types/goals";

export interface TournamentStats {
  totalGoals: number;
  matchesPlayed: number;
  matchCount: number;
}

/** Fetch all games and compute tournament goal totals */
export async function fetchTournamentStats(): Promise<TournamentStats> {
  const res = await fetch(`${WORLDCUP_API_URL}/get/games`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`World Cup API failed: ${res.status}`);
  }

  const { games } = (await res.json()) as WorldCupGamesResponse;

  const totalGoals = games.reduce(
    (sum, g) =>
      sum + parseInt(g.home_score, 10) + parseInt(g.away_score, 10),
    0
  );

  const matchesPlayed = games.filter((g) => g.finished === "TRUE").length;

  return { totalGoals, matchesPlayed, matchCount: games.length };
}

/** 
 * Normalize a local_date like "06/13/2026 21:00" (or "MM/DD/YYYY" or ISO)
 * to YYYY-MM-DD **as experienced in Ljubljana, Slovenia (Europe/Ljubljana)**.
 * 
 * We parse the wall time components, create an instant (treating numbers as UTC wall time for conversion),
 * then use Intl to get the calendar date in Ljubljana TZ. This ensures daily goal buckets
 * ("goals scored trend by day") and the "up to today" cutoff are correct for Slovenian time.
 */
function normalizeToYMD(input: string): string {
  if (!input) return "";

  // Already ISO-like
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    return input.slice(0, 10);
  }

  // Parse "MM/DD/YYYY HH:mm" or "MM/DD/YYYY"
  const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (match) {
    const [, m, d, y, hh = '00', mm = '00'] = match;

    // Create a UTC instant from the wall-time numbers in the string.
    // Then ask Intl what the date is in Ljubljana time zone.
    const utcMs = Date.UTC(
      parseInt(y, 10),
      parseInt(m, 10) - 1,
      parseInt(d, 10),
      parseInt(hh, 10),
      parseInt(mm, 10)
    );

    const ljDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Ljubljana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(utcMs));

    return ljDate; // already in YYYY-MM-DD
  }

  // Fallback: parse whatever we can, then project the instant into Ljubljana TZ
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

/** Fetch games and return daily goal counts (aggregated by local match date).
 *  Sorted ascending by date. Used for the Trends analytics card.
 */
export async function fetchDailyGoalTrends(): Promise<DailyGoal[]> {
  const res = await fetch(`${WORLDCUP_API_URL}/get/games`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 }, // modest cache; the sync route protects write path
  });

  if (!res.ok) {
    throw new Error(`World Cup API failed: ${res.status}`);
  }

  const { games } = (await res.json()) as WorldCupGamesResponse;

  const byDay = new Map<string, number>();

  for (const g of games) {
    const ymd = normalizeToYMD(g.local_date);
    if (!ymd) continue;
    const goals = parseInt(g.home_score, 10) + parseInt(g.away_score, 10);
    byDay.set(ymd, (byDay.get(ymd) ?? 0) + goals);
  }

  const sorted: DailyGoal[] = Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, goals]) => ({ date, goals }));

  return sorted;
}
