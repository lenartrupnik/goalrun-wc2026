import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { GlobalStats, LeaderboardEntry } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: stats }, { data: leaderboard }] = await Promise.all([
    supabase.from("global_stats").select("*").eq("id", 1).single(),
    supabase.from("leaderboard").select("*").order("rank", { ascending: true }).limit(50),
  ]);

  // Calculate user's total km from runs
  const { data: userRuns } = await supabase
    .from("runs")
    .select("distance_km")
    .eq("user_id", user.id);

  const userKmRun =
    userRuns?.reduce((sum, r) => sum + Number(r.distance_km), 0) ?? 0;

  const defaultStats = {
    id: 1,
    total_goals: 0,
    matches_played: 0,
    last_goal_at: null,
    updated_at: new Date().toISOString(),
  };

  return (
    <DashboardClient
      initialStats={(stats as GlobalStats | null) ?? defaultStats}
      initialLeaderboard={(leaderboard as LeaderboardEntry[] | null) ?? []}
      userKmRun={userKmRun}
      currentUserId={user.id}
    />
  );
}