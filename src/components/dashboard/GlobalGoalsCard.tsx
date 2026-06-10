"use client";

import { useEffect } from "react";
import { Goal, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useGlobalStats } from "@/lib/hooks/useGlobalStats";
import { POLL_INTERVAL_MS, KM_PER_GOAL } from "@/lib/constants";
import { formatRelative } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import type { GlobalStats } from "@/types/database";

interface GlobalGoalsCardProps {
  initial: GlobalStats;
}

export function GlobalGoalsCard({ initial }: GlobalGoalsCardProps) {
  const stats = useGlobalStats(initial);

  // Dev-only fallback poll; production uses Vercel cron + Supabase Realtime
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const sync = () => fetch("/api/worldcup/sync").catch(() => {});
    sync();
    const id = setInterval(sync, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const totalKmRequired = stats.total_goals * KM_PER_GOAL;

  return (
    <Card glow>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-goal-muted">World Cup Goals</p>
          <motion.p
            key={stats.total_goals}
            initial={{ scale: 1.2, color: "#f5c542" }}
            animate={{ scale: 1, color: "#f0fdf4" }}
            className="mt-1 text-4xl font-bold"
          >
            {stats.total_goals}
          </motion.p>
        </div>
        <div className="rounded-full bg-pitch-800 p-3">
          <Goal className="h-6 w-6 text-goal-gold" />
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-goal-muted">Total km required</span>
          <span className="font-medium">{totalKmRequired} km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-goal-muted">Matches played</span>
          <span className="font-medium">{stats.matches_played}</span>
        </div>
        <div className="flex items-center gap-1 text-goal-muted">
          <RefreshCw className="h-3 w-3" />
          <span>Updated {formatRelative(stats.updated_at)}</span>
        </div>
      </div>
    </Card>
  );
}