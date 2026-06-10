"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GlobalStats } from "@/types/database";

export function useGlobalStats(initial: GlobalStats) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("global_stats_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "global_stats",
          filter: "id=eq.1",
        },
        (payload) => {
          setStats(payload.new as GlobalStats);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return stats;
}