"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import { deleteAllRuns, deleteMyRuns } from "@/lib/actions/runs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
} | null;

export function PowerUserPanel() {
  const [myRunsState, deleteMyRunsAction, deletingMyRuns] = useActionState(
    async (_prev: ActionState) => (await deleteMyRuns()) ?? null,
    null
  );

  const [allRunsState, deleteAllRunsAction, deletingAllRuns] = useActionState(
    async (_prev: ActionState, formData: FormData) =>
      (await deleteAllRuns(formData)) ?? null,
    null
  );

  return (
    <Card className="border-red-900/50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Developer tools</h2>
          <p className="mt-1 text-sm text-goal-muted">
            Visible only to power users. Use these to clear test data before launch.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Clear my runs</h3>
            <p className="text-sm text-goal-muted">
              Removes every run logged under your account only.
            </p>
          </div>

          {myRunsState?.error && (
            <p className="text-sm text-red-400">{myRunsState.error}</p>
          )}
          {myRunsState?.success && myRunsState.message && (
            <p className="text-sm text-pitch-300">{myRunsState.message}</p>
          )}

          <form action={deleteMyRunsAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={deletingMyRuns}
              className="border-red-800 text-red-300 hover:bg-red-950/40 hover:text-red-200"
            >
              {deletingMyRuns ? "Deleting..." : "Delete my runs"}
            </Button>
          </form>
        </section>

        <section className="space-y-3 border-t border-pitch-800 pt-6">
          <div>
            <h3 className="text-sm font-medium text-red-300">Reset entire leaderboard</h3>
            <p className="text-sm text-goal-muted">
              Deletes every run from every user. Profiles and World Cup stats are kept.
            </p>
          </div>

          {allRunsState?.error && (
            <p className="text-sm text-red-400">{allRunsState.error}</p>
          )}
          {allRunsState?.success && allRunsState.message && (
            <p className="text-sm text-pitch-300">{allRunsState.message}</p>
          )}

          <form action={deleteAllRunsAction} className="space-y-3">
            <div>
              <label htmlFor="reset-confirmation" className="mb-1.5 block text-sm text-goal-muted">
                Type RESET to confirm
              </label>
              <Input
                id="reset-confirmation"
                name="confirmation"
                placeholder="RESET"
                autoComplete="off"
                className="max-w-xs"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={deletingAllRuns}
              className="border-red-800 text-red-300 hover:bg-red-950/40 hover:text-red-200"
            >
              {deletingAllRuns ? "Resetting..." : "Delete all runs"}
            </Button>
          </form>
        </section>
      </div>
    </Card>
  );
}