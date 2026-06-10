"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/types/database";

const LIMIT = 50;

export function useLeaderboard(initial: LeaderboardEntry[]) {
  const [entries, setEntries] = useState(initial);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("leaderboard")
      .select("*")
      .order("rank", { ascending: true })
      .limit(LIMIT);

    if (data) setEntries(data as LeaderboardEntry[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("leaderboard_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "runs" },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return entries;
}