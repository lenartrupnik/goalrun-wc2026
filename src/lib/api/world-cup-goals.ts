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

/** Normalize "MM/DD/YYYY HH:mm" (or similar) or already "YYYY-MM-DD" to "YYYY-MM-DD" */
function normalizeToYMD(input: string): string {
  if (!input) return "";
  // Already ISO-like date
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    return input.slice(0, 10);
  }
  // From "06/13/2026 21:00" or "06/13/2026"
  const datePart = input.split(" ")[0];
  const parts = datePart.split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Fallback: try Date
  try {
    const dt = new Date(input);
    if (!isNaN(dt.getTime())) {
      return dt.toISOString().slice(0, 10);
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
