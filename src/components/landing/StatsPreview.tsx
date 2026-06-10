import { Goal, Footprints } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { MotionFadeIn } from "@/components/ui/MotionFadeIn";
import { formatKm } from "@/lib/utils";
import { KM_PER_GOAL } from "@/lib/constants";
import type { CommunityProgress, GlobalStats } from "@/types/database";

export async function StatsPreview() {
  const supabase = await createClient();

  const [{ data: stats }, { data: community }] = await Promise.all([
    supabase.from("global_stats").select("*").eq("id", 1).single(),
    supabase.from("community_progress").select("*").single(),
  ]);

  const globalStats = stats as GlobalStats | null;
  const communityStats = community as CommunityProgress | null;

  const totalGoals = globalStats?.total_goals ?? 0;
  const totalKmRequired = totalGoals * KM_PER_GOAL;
  const totalKmLogged = communityStats?.total_km_logged ?? 0;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <MotionFadeIn>
          <h2 className="text-center text-2xl font-bold">Live Tournament Stats</h2>
          <p className="mt-2 text-center text-sm text-goal-muted">
            Updated in realtime during World Cup 2026
            {totalGoals === 0 && " — counts appear once matches begin"}
          </p>
        </MotionFadeIn>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MotionFadeIn delay={0.1}>
            <Card className="text-center" glow>
              <Goal className="mx-auto h-8 w-8 text-goal-gold" />
              <p className="mt-3 text-3xl font-bold">{totalGoals}</p>
              <p className="text-sm text-goal-muted">Goals Scored</p>
            </Card>
          </MotionFadeIn>

          <MotionFadeIn delay={0.2}>
            <Card className="text-center">
              <Footprints className="mx-auto h-8 w-8 text-pitch-300" />
              <p className="mt-3 text-3xl font-bold">{formatKm(totalKmRequired)}</p>
              <p className="text-sm text-goal-muted">Total km Required</p>
            </Card>
          </MotionFadeIn>

          <MotionFadeIn delay={0.3}>
            <Card className="text-center">
              <Footprints className="mx-auto h-8 w-8 text-pitch-400" />
              <p className="mt-3 text-3xl font-bold">{formatKm(totalKmLogged)}</p>
              <p className="text-sm text-goal-muted">Community km Logged</p>
            </Card>
          </MotionFadeIn>
        </div>
      </div>
    </section>
  );
}