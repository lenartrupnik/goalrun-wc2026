"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateMyRun, deleteMyRun } from "@/lib/actions/runs";
import type { Run } from "@/types/database";

interface MyRunsTableProps {
  runs: Run[];
  userId: string;
}

interface EditState {
  id: string;
  distance_km: string;
  notes: string;
}

export function MyRunsTable({ runs, userId }: MyRunsTableProps) {
  const [localRuns, setLocalRuns] = useState<Run[]>(runs);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [isPending, startTransition] = useTransition();

  // Keep local in sync when parent/hook provides fresh list (realtime or server revalidate)
  useEffect(() => {
    setLocalRuns(runs);
  }, [runs]);

  const startEdit = (run: Run) => {
    setEditing({
      id: run.id,
      distance_km: String(run.distance_km),
      notes: run.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  const handleSave = () => {
    if (!editing) return;

    const dist = parseFloat(editing.distance_km);
    if (Number.isNaN(dist) || dist < 0.1 || dist > 999) {
      toast.error("Distance must be between 0.1 and 999 km");
      return;
    }

    const prevSnapshot = localRuns;

    // Optimistic update for instant feel
    setLocalRuns((current) =>
      current.map((r) =>
        r.id === editing.id
          ? {
              ...r,
              distance_km: dist,
              notes: editing.notes.trim() ? editing.notes.trim() : null,
            }
          : r
      )
    );

    const toSave = { ...editing };
    setEditing(null);

    startTransition(async () => {
      const result = await updateMyRun(toSave.id, {
        distance_km: dist,
        notes: toSave.notes.trim() ? toSave.notes.trim() : null,
      });

      if (result?.error) {
        toast.error(result.error);
        setLocalRuns(prevSnapshot); // revert
      } else {
        toast.success("Run updated");
        // Realtime (useMyRuns) + server revalidate will keep everything fresh
      }
    });
  };

  const handleDelete = (runId: string, runDate: string) => {
    const confirmMsg = `Delete the ${runDate} run? This cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    const prevSnapshot = localRuns;

    // Optimistic remove
    setLocalRuns((current) => current.filter((r) => r.id !== runId));

    startTransition(async () => {
      const result = await deleteMyRun(runId);

      if (result?.error) {
        toast.error(result.error);
        setLocalRuns(prevSnapshot);
      } else {
        toast.success("Run deleted");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <Card>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Runs</h2>
          <p className="mt-1 text-sm text-goal-muted">
            Your previous runs. Edit km or notes if you made a mistake when logging.
          </p>
        </div>
        <div className="text-xs text-goal-muted tabular-nums">
          {localRuns.length} {localRuns.length === 1 ? "entry" : "entries"}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-pitch border border-pitch-800">
        <div className="max-h-[380px] overflow-auto">
          {localRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-goal-muted">No runs logged yet.</p>
              <p className="mt-1 text-xs text-goal-muted">
                Use the Log a Run form above — your entries will appear here instantly.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-pitch-800">
                <tr className="text-left text-goal-muted">
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="w-24 px-3 py-2.5 font-medium sm:w-28">Km</th>
                  <th className="px-3 py-2.5 font-medium">Notes</th>
                  <th className="w-20 px-2 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pitch-800 text-goal-white">
                {localRuns.map((run) => {
                  const isEditingThis = editing?.id === run.id;
                  const displayDate = formatDate(run.run_date);

                  return (
                    <tr
                      key={run.id}
                      className="group hover:bg-pitch-800/50 transition-colors"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                        {displayDate}
                      </td>

                      <td className="px-3 py-2.5">
                        {isEditingThis ? (
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="999"
                            value={editing!.distance_km}
                            onChange={(e) =>
                              setEditing((s) =>
                                s ? { ...s, distance_km: e.target.value } : null
                              )
                            }
                            onKeyDown={handleKeyDown}
                            className="h-8 py-1 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium tabular-nums">
                            {run.distance_km}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2.5">
                        {isEditingThis ? (
                          <Input
                            value={editing!.notes}
                            onChange={(e) =>
                              setEditing((s) =>
                                s ? { ...s, notes: e.target.value } : null
                              )
                            }
                            onKeyDown={handleKeyDown}
                            placeholder="Optional note"
                            className="h-8 py-1 text-sm"
                          />
                        ) : (
                          <span
                            className="block max-w-[240px] truncate text-goal-muted sm:max-w-[320px]"
                            title={run.notes || undefined}
                          >
                            {run.notes?.trim() ? run.notes : "—"}
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-1.5">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100">
                          {isEditingThis ? (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleSave}
                                disabled={isPending}
                                aria-label="Save changes"
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelEdit}
                                disabled={isPending}
                                aria-label="Cancel edit"
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(run)}
                                aria-label="Edit run"
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(run.id, displayDate)}
                                aria-label="Delete run"
                                className="h-8 w-8 p-0 text-red-400 hover:bg-red-950/40 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-snug text-goal-muted">
        Tip: Editing km automatically updates your total progress and the live leaderboard via realtime.
      </p>
    </Card>
  );
}
