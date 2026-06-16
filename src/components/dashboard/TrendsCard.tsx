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

  // Merge timeline: prefer WC match days (for "goals trend"), include any extra user run days
  const chartData: ChartPoint[] = useMemo(() => {
    const allDates = new Set<string>();
    for (const g of dailyGoals) allDates.add(g.date);
    for (const d of userCumByDate.keys()) allDates.add(d);

    const sorted = Array.from(allDates).sort();

    let runningUser = 0;
    return sorted.map((date) => {
      const dailyG = dailyGoals.find((g) => g.date === date)?.goals ?? 0;
      const userAdded = userCumByDate.has(date) ? (userCumByDate.get(date) ?? 0) : 0;
      // For display we want the cumulative *as of* this date (carry forward previous cum)
      if (userCumByDate.has(date)) {
        runningUser = userCumByDate.get(date)!;
      }
      return {
        date,
        dailyGoals: dailyG,
        userCumKm: runningUser,
      };
    });
  }, [dailyGoals, userCumByDate]);

  const hasData = chartData.length > 0;
  const maxDaily = Math.max(1, ...chartData.map((p) => p.dailyGoals));
  const maxCum = Math.max(1, ...chartData.map((p) => p.userCumKm));

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
    if (chartData.length <= 1) return paddingLeft + innerW / 2;
    return paddingLeft + (i / (chartData.length - 1)) * innerW;
  }

  function yForDaily(goals: number) {
    return paddingTop + innerH - (goals / maxDaily) * (innerH * 0.82);
  }

  function yForCum(km: number) {
    return paddingTop + innerH - (km / maxCum) * (innerH * 0.82);
  }

  // Build bar + line geometry
  const bars = chartData.map((p, i) => {
    const x = xForIndex(i);
    const barH = Math.max(1, (p.dailyGoals / maxDaily) * (innerH * 0.82));
    const y = paddingTop + innerH - barH;
    return { x, y, w: barWidth, h: barH, ...p, i };
  });

  const linePoints = chartData
    .map((p, i) => {
      const x = xForIndex(i);
      const y = yForCum(p.userCumKm);
      return `${x},${y}`;
    })
    .join(" ");

  const hovered = hoveredIndex != null ? chartData[hoveredIndex] : null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Trends</h2>
          <p className="mt-1 text-sm text-goal-muted">
            Daily World Cup goals (bars) and your cumulative km over time (line)
          </p>
        </div>
        <div className="hidden text-[10px] text-goal-muted sm:block">
          {hasData ? `${chartData.length} days` : "No data yet"}
        </div>
      </div>

      <div className="mt-4">
        {!hasData ? (
          <div className="flex h-[200px] flex-col items-center justify-center rounded border border-pitch-800 text-center text-sm text-goal-muted">
            <p>No match data or runs yet.</p>
            <p className="mt-1 text-xs">Log runs to see your cumulative trend. Goals will appear once the tournament starts.</p>
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
                aria-label="Daily goals and cumulative km trend chart"
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

                {/* Bars (daily goals) */}
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

                {/* Cumulative KM line + dots */}
                {chartData.length > 1 && (
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="#f5c542"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.95}
                  />
                )}
                {chartData.map((p, idx) => {
                  const x = xForIndex(idx);
                  const y = yForCum(p.userCumKm);
                  const isActive = hoveredIndex === idx;
                  return (
                    <g
                      key={`dot-${idx}`}
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

                {/* X labels - sampled to avoid crowding */}
                {chartData.map((p, idx) => {
                  const show = chartData.length <= 8 || idx % Math.ceil(chartData.length / 7) === 0 || idx === chartData.length - 1;
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
                <span className="text-goal-gold">{hovered.userCumKm.toFixed(hovered.userCumKm % 1 === 0 ? 0 : 1)} km cum</span>
              </div>
            )}

            <div className="mt-2 flex justify-between text-[10px] text-goal-muted">
              <div>
                {chartData.length > 0 && (
                  <>
                    {formatShortDate(chartData[0].date)} → {formatShortDate(chartData[chartData.length - 1].date)}
                  </>
                )}
              </div>
              <div className="hidden sm:block">Hover bars/dots for values</div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] leading-snug text-goal-muted">
        Bars show goals scored across matches on that day. The gold line tracks your personal running total (updates instantly when you log or edit runs).
      </p>
    </Card>
  );
}
