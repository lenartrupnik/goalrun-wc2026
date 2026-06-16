"use client";

import { useActionState, useEffect, useState, type ComponentType } from "react";
import { format } from "date-fns";
import { Plus, Bike, Footprints } from "lucide-react";
import { toast } from "sonner";
import { logRun } from "@/lib/actions/runs";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function LogRunForm() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activityType, setActivityType] = useState<'run' | 'bike'>('run');

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return (await logRun(formData)) ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state?.success]);

  const dismissSuccess = () => setShowSuccess(false);

  return (
    <Card>
      <h2 className="text-lg font-semibold">Log Activity</h2>
      <p className="mt-1 text-sm text-goal-muted">
        Record a run or bike ride. Bikes count as 50% toward your progress.
      </p>

      <form
        action={formAction}
        className="mt-4 space-y-4"
        onSubmit={() => {
          setShowSuccess(false);
          if (activityType === 'bike') {
            const roasts = [
              "A bike ride? Seriously? That's what pussies do when they're too scared to actually run.",
              "Bike logged. Half the distance, twice the shame. Real runners are laughing at you.",
              "Wow, a bike instead of running. Bold choice for someone who clearly can't keep up.",
              "Congratulations on your 'run'. The rest of us earned full credit like adults.",
            ];
            const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
            toast(randomRoast, { duration: 11000 });
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="distance_km" className="mb-1.5 block text-sm text-goal-muted">
              Distance (km)
            </label>
            <Input
              id="distance_km"
              name="distance_km"
              type="number"
              step="0.1"
              min="0.1"
              max="999"
              required
              placeholder="5.0"
              onChange={dismissSuccess}
            />
          </div>
          <div>
            <label htmlFor="run_date" className="mb-1.5 block text-sm text-goal-muted">
              Date
            </label>
            <Input
              id="run_date"
              name="run_date"
              type="date"
              required
              defaultValue={today}
              onChange={dismissSuccess}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-goal-muted">
            Activity type
          </label>
          <div className="flex rounded-pitch border border-pitch-700 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setActivityType('run')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 transition ${activityType === 'run' ? 'bg-pitch-700 text-goal-white' : 'hover:bg-pitch-800 text-goal-muted'}`}
            >
              <Footprints className="h-4 w-4" />
              Run (×1)
            </button>
            <button
              type="button"
              onClick={() => setActivityType('bike')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 transition border-l border-pitch-700 ${activityType === 'bike' ? 'bg-pitch-700 text-goal-white' : 'hover:bg-pitch-800 text-goal-muted'}`}
            >
              <Bike className="h-4 w-4" />
              Bike ride (×½)
            </button>
          </div>
          <input type="hidden" name="activity_type" value={activityType} />
          <p className="mt-1 text-[10px] text-goal-muted">
            Bike rides count as half a kilometer toward your total and the leaderboard (although this is for pussies we can&apos;t do it otherwise).
          </p>
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm text-goal-muted">
            Notes (optional)
          </label>
          <Input
            id="notes"
            name="notes"
            placeholder="Morning jog around the park"
            onChange={dismissSuccess}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        {showSuccess && (
          <p className="text-sm text-pitch-300">Activity logged successfully!</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          <Plus className="h-4 w-4" />
          {pending ? "Logging..." : "Log Activity"}
        </Button>
      </form>

      {showConfetti && (
        <ConfettiBurst />
      )}
    </Card>
  );
}

function ConfettiBurst() {
  const [Confetti, setConfetti] = useState<ComponentType<{
    width: number;
    height: number;
    recycle: boolean;
    numberOfPieces: number;
  }> | null>(null);

  useEffect(() => {
    import("react-confetti").then((mod) => setConfetti(() => mod.default));
  }, []);

  if (!Confetti) return null;

  return (
    <Confetti
      width={typeof window !== "undefined" ? window.innerWidth : 300}
      height={typeof window !== "undefined" ? window.innerHeight : 200}
      recycle={false}
      numberOfPieces={200}
    />
  );
}