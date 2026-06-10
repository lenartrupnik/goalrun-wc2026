"use client";

import { Trophy, Medal, Award } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatKm, formatPercent } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/database";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
  totalGoals: number;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-goal-gold" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
  return (
    <span className="flex h-5 w-5 items-center justify-center text-sm font-medium text-goal-muted">
      {rank}
    </span>
  );
}

export function Leaderboard({ entries, currentUserId, totalGoals }: LeaderboardProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Leaderboard</h2>
      <p className="mt-1 text-sm text-goal-muted">Live rankings — updates in realtime</p>

      <div className="mt-4 divide-y divide-pitch-700">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-goal-muted">
            No runners yet. Be the first to log a run!
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 py-3 ${
                entry.user_id === currentUserId ? "bg-pitch-800/50 -mx-2 px-2 rounded-pitch" : ""
              }`}
            >
              <RankIcon rank={entry.rank} />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pitch-700 text-sm font-medium">
                {entry.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">
                  {entry.name}
                  {entry.user_id === currentUserId && (
                    <span className="ml-2 text-xs text-pitch-300"> (you)</span>
                  )}
                </p>
                <p className="text-sm text-goal-muted">
                  {formatKm(entry.km_run)} ·{" "}
                  {totalGoals === 0 ? "—" : formatPercent(entry.percent_complete)}
                </p>
              </div>
              <div className="hidden sm:block w-24">
                <div className="h-1.5 overflow-hidden rounded-full bg-pitch-800">
                  <div
                    className="h-full rounded-full bg-pitch-400"
                    style={{ width: `${Math.min(entry.percent_complete, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}