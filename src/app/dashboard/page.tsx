import { redirect } from "next/navigation";
import { isPowerUser } from "@/lib/auth/power-user";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { fetchDailyGoalTrends } from "@/lib/api/world-cup-goals";
import type { GlobalStats, LeaderboardEntry, Run } from "@/types/database";
import type { DailyGoal } from "@/types/goals";

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
    myRunsData?.reduce((sum, r) => {
      const at = (r as any).activity_type || 'run';
      const mult = at === 'bike' ? 0.5 : 1;
      return sum + Number(r.distance_km) * mult;
    }, 0) ?? 0;

  // Daily goals for the Trends analytics card (computed from full games list).
  // fetchDailyGoalTrends is defensive (catches network/fetch errors and returns []).
  // This prevents the dashboard from crashing if the external WC API is down/unreachable.
  const dailyGoals = await fetchDailyGoalTrends();

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
      initialDailyGoals={dailyGoals}
      userKmRun={userKmRun}
      currentUserId={user.id}
      isPowerUser={isPowerUser(user.email)}
    />
  );
}