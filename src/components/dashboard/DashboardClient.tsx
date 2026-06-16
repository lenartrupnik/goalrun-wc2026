"use client";

import { GlobalGoalsCard } from "./GlobalGoalsCard";
import { PersonalProgress } from "./PersonalProgress";
import { LogRunForm } from "./LogRunForm";
import { Leaderboard } from "./Leaderboard";
import { PowerUserPanel } from "./PowerUserPanel";
import { MyRunsTable } from "./MyRunsTable";
import { TrendsCard } from "./TrendsCard";
import { useGlobalStats } from "@/lib/hooks/useGlobalStats";
import { useLeaderboard } from "@/lib/hooks/useLeaderboard";
import { useMyRuns } from "@/lib/hooks/useMyRuns";
import type { GlobalStats, LeaderboardEntry, Run } from "@/types/database";
import type { DailyGoal } from "@/types/goals";

interface DashboardClientProps {
  initialStats: GlobalStats;
  initialLeaderboard: LeaderboardEntry[];
  initialMyRuns: Run[];
  initialDailyGoals: DailyGoal[];
  userKmRun: number;
  currentUserId: string;
  isPowerUser: boolean;
}

export function DashboardClient({
  initialStats,
  initialLeaderboard,
  initialMyRuns,
  initialDailyGoals,
  userKmRun,
  currentUserId,
  isPowerUser,
}: DashboardClientProps) {
  const stats = useGlobalStats(initialStats);
  const leaderboard = useLeaderboard(initialLeaderboard);
  const myRuns = useMyRuns(initialMyRuns, currentUserId);

  const liveUserKm =
    leaderboard.find((e) => e.user_id === currentUserId)?.km_run ?? userKmRun;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <GlobalGoalsCard stats={stats} />
        <PersonalProgress kmRun={Number(liveUserKm)} totalGoals={stats.total_goals} />
      </div>

      <TrendsCard dailyGoals={initialDailyGoals} runs={myRuns.runs} />

      <div className="grid gap-6 lg:grid-cols-2">
        <LogRunForm />
        <Leaderboard
          entries={leaderboard}
          currentUserId={currentUserId}
          totalGoals={stats.total_goals}
        />
      </div>

      <MyRunsTable runs={myRuns.runs} userId={currentUserId} />

      {isPowerUser && <PowerUserPanel />}
    </div>
  );
}