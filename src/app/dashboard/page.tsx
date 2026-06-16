import { redirect } from "next/navigation";
import { isPowerUser } from "@/lib/auth/power-user";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { GlobalStats, LeaderboardEntry, Run } from "@/types/database";

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

  // Fetch user's runs for total km + the editable previous runs table
  const { data: myRunsData } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", user.id)
    .order("run_date", { ascending: false })
    .order("created_at", { ascending: false });

  const userKmRun =
    myRunsData?.reduce((sum, r) => sum + Number(r.distance_km), 0) ?? 0;

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
      initialMyRuns={(myRunsData as Run[] | null) ?? []}
      userKmRun={userKmRun}
      currentUserId={user.id}
      isPowerUser={isPowerUser(user.email)}
    />
  );
}