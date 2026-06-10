import { WORLDCUP_API_URL } from "@/lib/constants";
import type { WorldCupGamesResponse } from "@/types/goals";

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