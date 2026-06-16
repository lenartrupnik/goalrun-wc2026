"use client";

import { Footprints, Target } from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { Card } from "@/components/ui/Card";
import { formatKm } from "@/lib/utils";
import { KM_PER_GOAL } from "@/lib/constants";

interface PersonalProgressProps {
  kmRun: number;
  totalGoals: number;
}

export function PersonalProgress({ kmRun, totalGoals }: PersonalProgressProps) {
  const kmRequired = totalGoals * KM_PER_GOAL;
  const kmRemaining = Math.max(0, kmRequired - kmRun);
  const percent =
    totalGoals === 0 ? 0 : Math.min(100, (kmRun / kmRequired) * 100);

  return (
    <Card>
      <h2 className="text-lg font-semibold">My Progress</h2>

      {totalGoals === 0 && (
        <p className="mt-2 text-xs text-goal-muted">
          Progress % updates once the tournament kicks off and goals are scored.
        </p>
      )}

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ProgressRing percent={percent} />

        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <Footprints className="h-5 w-5 text-pitch-300" />
            <div>
              <p className="text-sm text-goal-muted">Effective km</p>
              <p className="text-xl font-bold">{formatKm(kmRun)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-goal-gold" />
            <div>
              <p className="text-sm text-goal-muted">Km remaining</p>
              <p className="text-xl font-bold">{formatKm(kmRemaining)}</p>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-pitch-800">
            <div
              className="h-full rounded-full bg-pitch-400 transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}