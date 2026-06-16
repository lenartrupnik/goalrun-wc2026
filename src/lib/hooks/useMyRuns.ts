"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Run } from "@/types/database";

export function useMyRuns(initial: Run[], userId: string) {
  const [runs, setRuns] = useState<Run[]>(initial);

  const refetch = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("runs")
      .select("*")
      .eq("user_id", userId)
      .order("run_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);

    if (data) setRuns(data as Run[]);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`my-runs-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "runs",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch to stay in sync (aggregates + list)
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  return { runs, refresh: refetch };
}
