"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatShortDate } from "@/lib/utils";
import type { DailyGoal } from "@/types/goals";
import type { Run } from "@/types/database";

interface TrendsCardProps {
  dailyGoals: DailyGoal[];
  runs: Run[];
}

interface ChartPoint {
  date: string;
  dailyGoals: number;
  userCumKm: number;
  goalsCum: number; // cumulative WC goals up to this day
}

export function TrendsCard({ dailyGoals, runs }: TrendsCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute user's daily added km + cumulative from the live runs list (realtime friendly)
  const userCumByDate = useMemo(() => {
    const dailyMap = new Map<string, number>();
    for (const r of runs) {
      const d = r.run_date; // already YYYY-MM-DD
      if (!d) continue;
      dailyMap.set(d, (dailyMap.get(d) ?? 0) + Number(r.distance_km));
    }
    // sort dates
    const sortedDates = Array.from(dailyMap.keys()).sort();
    let cum = 0;
    const cumMap = new Map<string, number>();
    for (const d of sortedDates) {
      cum += dailyMap.get(d) ?? 0;
      cumMap.set(d, cum);
    }
    return cumMap;
  }, [runs]);

  // Cumulative goals (WC total scored so far) per date — for the rising comparison line
  const goalsCumByDate = useMemo(() => {
    let cum = 0;
    const map = new Map<string, number>();
    for (const g of dailyGoals) {
      cum += g.goals;
      map.set(g.date, cum);
    }
    return map;
  }, [dailyGoals]);

  // Merge timeline: WC days + user run days.
  // We trim to "as of today" below so the chart only shows history up to the current real date.
  const chartData: ChartPoint[] = useMemo(() => {
    const allDates = new Set<string>();
    for (const g of dailyGoals) allDates.add(g.date);
    for (const d of userCumByDate.keys()) allDates.add(d);

    const sorted = Array.from(allDates).sort();

    let runningUser = 0;
    let runningGoals = 0;

    return sorted.map((date) => {
      const dailyG = dailyGoals.find((g) => g.date === date)?.goals ?? 0;

      // carry forward user's cumulative km
      if (userCumByDate.has(date)) {
        runningUser = userCumByDate.get(date)!;
      }

      // carry forward cumulative goals (total scored in the WC up to this day)
      if (goalsCumByDate.has(date)) {
        runningGoals = goalsCumByDate.get(date)!;
      }

      return {
        date,
        dailyGoals: dailyG,
        userCumKm: runningUser,
        goalsCum: runningGoals,
      };
    });
  }, [dailyGoals, userCumByDate, goalsCumByDate]);

  // Only show data up to "today" (real calendar date). This makes the chart update daily
  // and avoids showing future WC matches that haven't happened yet.
  const todayYMD = new Date().toISOString().slice(0, 10);
  const visibleData = chartData.filter((p) => p.date <= todayYMD);

  const hasData = visibleData.length > 0;
  const maxDaily = Math.max(1, ...visibleData.map((p) => p.dailyGoals));
  const maxUserCum = Math.max(1, ...visibleData.map((p) => p.userCumKm));
  const maxGoalsCum = Math.max(1, ...visibleData.map((p) => p.goalsCum));

  // SVG sizing (logical units)
  const W = 720;
  const H = 200;
  const paddingLeft = 36;
  const paddingRight = 28;
  const paddingTop = 12;
  const paddingBottom = 28;
  const innerW = W - paddingLeft - paddingRight;
  const innerH = H - paddingTop - paddingBottom;

  const barWidth = Math.max(3, Math.min(18, innerW / Math.max(1, chartData.length) - 4));

  function xForIndex(i: number) {
    if (visibleData.length <= 1) return paddingLeft + innerW / 2;
    return paddingLeft + (i / (visibleData.length - 1)) * innerW;
  }

  function yForDaily(goals: number) {
    return paddingTop + innerH - (goals / maxDaily) * (innerH * 0.82);
  }

  function yForUserCum(km: number) {
    return paddingTop + innerH - (km / maxUserCum) * (innerH * 0.82);
  }

  function yForGoalsCum(cum: number) {
    return paddingTop + innerH - (cum / maxGoalsCum) * (innerH * 0.82);
  }

  // Build bar + line geometry (only using data up to today)
  const bars = visibleData.map((p, i) => {
    const x = xForIndex(i);
    const barH = Math.max(1, (p.dailyGoals / maxDaily) * (innerH * 0.82));
    const y = paddingTop + innerH - barH;
    return { x, y, w: barWidth, h: barH, ...p, i };
  });

  const userLinePoints = visibleData
    .map((p, i) => {
      const x = xForIndex(i);
      const y = yForUserCum(p.userCumKm);
      return `${x},${y}`;
    })
    .join(" ");

  const goalsCumLinePoints = visibleData
    .map((p, i) => {
      const x = xForIndex(i);
      const y = yForGoalsCum(p.goalsCum);
      return `${x},${y}`;
    })
    .join(" ");

  const hovered = hoveredIndex != null ? visibleData[hoveredIndex] : null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Trends</h2>
          <p className="mt-1 text-sm text-goal-muted">
            Daily goals (bars) • Cumulative WC goals (dashed) • Your cumulative km (gold) — up to today only
          </p>
        </div>
        <div className="hidden text-[10px] text-goal-muted sm:block">
          {hasData ? `${visibleData.length} days` : "No data yet"}
        </div>
      </div>

      <div className="mt-4">
        {!hasData ? (
          <div className="flex h-[200px] flex-col items-center justify-center rounded border border-pitch-800 text-center text-sm text-goal-muted">
            <p>No data up to today yet.</p>
            <p className="mt-1 text-xs">Log runs to see your cumulative km. Daily goals + cumulative WC goals will appear as matches are played.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Legend */}
            <div className="mb-2 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-3 rounded-sm bg-pitch-400" />
                <span className="text-goal-muted">Daily goals</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 bg-[#5bc48a]" />
                <span className="text-goal-muted">Cumulative goals (WC)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 bg-goal-gold" />
                <span className="text-goal-muted">Your cumulative km</span>
              </div>
            </div>

            {/* Chart */}
            <div className="overflow-x-auto pb-1">
              <svg
                width="100%"
                height="200"
                viewBox={`0 0 ${W} ${H}`}
                className="min-w-[520px] rounded border border-pitch-800 bg-pitch-900/40"
                aria-label="Daily goals, cumulative WC goals, and your cumulative km trend chart"
              >
                {/* subtle horizontal grid */}
                {[0, 1, 2, 3].map((n) => {
                  const y = paddingTop + (n / 3) * innerH;
                  return (
                    <line
                      key={n}
                      x1={paddingLeft}
                      x2={W - paddingRight}
                      y1={y}
                      y2={y}
                      stroke="#1a3d28"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Bars (daily goals scored that day) */}
                {bars.map((b, idx) => (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-crosshair"
                  >
                    <rect
                      x={b.x - b.w / 2}
                      y={b.y}
                      width={b.w}
                      height={b.h}
                      rx="2"
                      className="fill-pitch-400 transition-opacity hover:opacity-90"
                      opacity={hoveredIndex == null || hoveredIndex === idx ? 0.95 : 0.35}
                    />
                  </g>
                ))}

                {/* Cumulative goals line (WC total rising) — dashed green for distinction */}
                {visibleData.length > 1 && (
                  <polyline
                    points={goalsCumLinePoints}
                    fill="none"
                    stroke="#5bc48a"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray="4 2"
                    opacity={0.9}
                  />
                )}

                {/* User's cumulative km line (solid gold) */}
                {visibleData.length > 1 && (
                  <polyline
                    points={userLinePoints}
                    fill="none"
                    stroke="#f5c542"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.95}
                  />
                )}

                {/* Dots for cumulative goals line */}
                {visibleData.map((p, idx) => {
                  const x = xForIndex(idx);
                  const y = yForGoalsCum(p.goalsCum);
                  const isActive = hoveredIndex === idx;
                  return (
                    <g
                      key={`goals-dot-${idx}`}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-crosshair"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isActive ? 4 : 2.5}
                        fill="#5bc48a"
                        stroke="#0a1f12"
                        strokeWidth={isActive ? 1.5 : 1}
                      />
                    </g>
                  );
                })}

                {/* Dots for user's km line */}
                {visibleData.map((p, idx) => {
                  const x = xForIndex(idx);
                  const y = yForUserCum(p.userCumKm);
                  const isActive = hoveredIndex === idx;
                  return (
                    <g
                      key={`user-dot-${idx}`}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-crosshair"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isActive ? 5 : 3}
                        className="fill-goal-gold stroke-pitch-900"
                        strokeWidth={isActive ? 2 : 1.5}
                      />
                    </g>
                  );
                })}

                {/* X labels - sampled to avoid crowding. Only for visible (current) days */}
                {visibleData.map((p, idx) => {
                  const show = visibleData.length <= 8 || idx % Math.ceil(visibleData.length / 7) === 0 || idx === visibleData.length - 1;
                  if (!show) return null;
                  const x = xForIndex(idx);
                  return (
                    <text
                      key={`x-${idx}`}
                      x={x}
                      y={H - 6}
                      textAnchor="middle"
                      className="fill-goal-muted text-[9px]"
                    >
                      {formatShortDate(p.date)}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Hover tooltip */}
            {hovered && (
              <div className="pointer-events-none absolute -top-1 right-2 rounded bg-pitch-800/95 px-3 py-1 text-xs shadow-pitch ring-1 ring-pitch-700">
                <span className="font-medium text-goal-white">{formatShortDate(hovered.date)}</span>
                <span className="mx-2 text-pitch-400">·</span>
                <span className="text-pitch-300">{hovered.dailyGoals} goals</span>
                <span className="mx-2 text-pitch-400">·</span>
                <span className="text-[#5bc48a]">{hovered.goalsCum} WC cum</span>
                <span className="mx-2 text-pitch-400">·</span>
                <span className="text-goal-gold">{hovered.userCumKm.toFixed(hovered.userCumKm % 1 === 0 ? 0 : 1)} km cum</span>
              </div>
            )}

            <div className="mt-2 flex justify-between text-[10px] text-goal-muted">
              <div>
                {visibleData.length > 0 && (
                  <>
                    {formatShortDate(visibleData[0].date)} → {formatShortDate(visibleData[visibleData.length - 1].date)}
                  </>
                )}
              </div>
              <div className="hidden sm:block">Hover bars/dots for values</div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] leading-snug text-goal-muted">
        Bars = daily goals scored. Dashed green line = cumulative goals in the tournament so far (rising total). Gold line = your personal cumulative km. The chart only goes up to today and grows daily as matches are played and you log runs.
      </p>
    </Card>
  );
}
