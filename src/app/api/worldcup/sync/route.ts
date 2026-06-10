import { NextResponse } from "next/server";
import { fetchTournamentStats } from "@/lib/api/world-cup-goals";
import { createAdminClient } from "@/lib/supabase/admin";
import { SYNC_MIN_INTERVAL_MS } from "@/lib/constants";
import type { GlobalStats } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthorizedCron(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

function wasRecentlySynced(updatedAt: string): boolean {
  const elapsed = Date.now() - new Date(updatedAt).getTime();
  return elapsed < SYNC_MIN_INTERVAL_MS;
}

/** Sync World Cup goals from external API into Supabase global_stats */
export async function GET(request: Request) {
  const forceSync = isAuthorizedCron(request);

  try {
    const admin = createAdminClient();

    const { data: currentData } = await admin
      .from("global_stats")
      .select("*")
      .eq("id", 1)
      .single();

    const current = currentData as GlobalStats | null;

    // Rate limit: skip external API if synced recently (unless external cron forces it)
    if (
      !forceSync &&
      current?.updated_at &&
      wasRecentlySynced(current.updated_at)
    ) {
      return NextResponse.json({
        totalGoals: current.total_goals,
        matchesPlayed: current.matches_played,
        matchCount: 0,
        lastUpdated: current.updated_at,
        source: "cached" as const,
        skipped: true,
      });
    }

    const stats = await fetchTournamentStats();

    const goalsIncreased =
      current !== null && stats.totalGoals > current.total_goals;

    const { error } = await admin
      .from("global_stats")
      .update({
        total_goals: stats.totalGoals,
        matches_played: stats.matchesPlayed,
        last_goal_at: goalsIncreased ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      totalGoals: stats.totalGoals,
      matchesPlayed: stats.matchesPlayed,
      matchCount: stats.matchCount,
      lastUpdated: new Date().toISOString(),
      source: "live" as const,
      goalsIncreased,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";

    try {
      const admin = createAdminClient();
      const { data: cachedData } = await admin
        .from("global_stats")
        .select("*")
        .eq("id", 1)
        .single();

      const cached = cachedData as GlobalStats | null;

      return NextResponse.json({
        totalGoals: cached?.total_goals ?? 0,
        matchesPlayed: cached?.matches_played ?? 0,
        matchCount: 0,
        lastUpdated: cached?.updated_at ?? new Date().toISOString(),
        source: "cached" as const,
        error: message,
      });
    } catch {
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }
}