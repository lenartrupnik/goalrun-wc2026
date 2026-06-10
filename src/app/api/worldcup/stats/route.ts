import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { KM_PER_GOAL } from "@/lib/constants";
import type { GlobalStats } from "@/types/database";

/** Public endpoint — reads cached stats from Supabase (no external API call) */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("global_stats")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Stats not found" },
      { status: 500 }
    );
  }

  const stats = data as GlobalStats;

  return NextResponse.json({
    totalGoals: stats.total_goals,
    matchesPlayed: stats.matches_played,
    totalKmRequired: stats.total_goals * KM_PER_GOAL,
    lastUpdated: stats.updated_at,
    lastGoalAt: stats.last_goal_at,
  });
}