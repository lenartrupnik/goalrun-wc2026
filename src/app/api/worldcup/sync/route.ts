import { NextResponse } from "next/server";
import { fetchTournamentStats } from "@/lib/api/world-cup-goals";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GlobalStats } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Sync World Cup goals from external API into Supabase global_stats */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow Vercel cron (with secret) or manual trigger in dev
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const stats = await fetchTournamentStats();
    const admin = createAdminClient();

    const { data: prevData } = await admin
      .from("global_stats")
      .select("total_goals")
      .eq("id", 1)
      .single();

    const prev = prevData as Pick<GlobalStats, "total_goals"> | null;
    const goalsIncreased =
      prev !== null && stats.totalGoals > prev.total_goals;

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

    // Fallback to cached DB value
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