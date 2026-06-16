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
 * to a YYYY-MM-DD that represents the day in Ljubljana/Slovenia time (Europe/Ljubljana).
 *
 * The API reports "local_date" in the match venue's local time (mostly North American for WC2026).
 * To make "goals scored trend by day" correct for a user in Slovenia, we take the venue local time,
 * add a fixed offset (~6h for US East -> Central Europe) to simulate when it "feels like" in Ljubljana,
 * and use the resulting day. Late US evening games (which are early morning in Europe) will roll to the next day.
 *
 * This way goals scored "in the night 3am/4am Ljubljana time" count for that Slovenian day.
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

    let year = parseInt(y, 10);
    let month = parseInt(m, 10) - 1;
    let day = parseInt(d, 10);
    let hour = parseInt(hh, 10);
    const min = parseInt(mm, 10);

    // Fixed offset to map API venue local time to approximate Ljubljana "feeling" of the day.
    // US evening (high hour in local_date) becomes early morning next day in Europe.
    // 6 hours works well for most WC2026 venues (EDT/CDT to CEST).
    const OFFSET = 6;
    hour += OFFSET;

    if (hour >= 24) {
      hour -= 24;
      day += 1;
    }

    // Use Date to safely handle month/year rollover (e.g. 31st +1)
    const adjusted = new Date(Date.UTC(year, month, day, hour, min));
    year = adjusted.getUTCFullYear();
    month = adjusted.getUTCMonth();
    day = adjusted.getUTCDate();

    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Fallback
  try {
    const dt = new Date(input);
    if (!isNaN(dt.getTime())) {
      // For fallback, also project through LJU for consistency, but the offset logic above is preferred
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
