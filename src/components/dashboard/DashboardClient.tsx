"use client";

import { GlobalGoalsCard } from "./GlobalGoalsCard";
import { PersonalProgress } from "./PersonalProgress";
import { LogRunForm } from "./LogRunForm";
import { Leaderboard } from "./Leaderboard";
import { useGlobalStats } from "@/lib/hooks/useGlobalStats";
import { useLeaderboard } from "@/lib/hooks/useLeaderboard";
import type { GlobalStats, LeaderboardEntry } from "@/types/database";

interface DashboardClientProps {
  initialStats: GlobalStats;
  initialLeaderboard: LeaderboardEntry[];
  userKmRun: number;
  currentUserId: string;
}

export function DashboardClient({
  initialStats,
  initialLeaderboard,
  userKmRun,
  currentUserId,
}: DashboardClientProps) {
  const stats = useGlobalStats(initialStats);
  const leaderboard = useLeaderboard(initialLeaderboard);

  const liveUserKm =
    leaderboard.find((e) => e.user_id === currentUserId)?.km_run ?? userKmRun;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <GlobalGoalsCard initial={initialStats} />
        <PersonalProgress kmRun={Number(liveUserKm)} totalGoals={stats.total_goals} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LogRunForm />
        <Leaderboard
          initial={initialLeaderboard}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}