import { NextResponse } from "next/server";
import { fetchDailyGoalTrends } from "@/lib/api/world-cup-goals";

/**
 * Public endpoint returning daily aggregated WC goals for charts.
 * Uses light revalidation in the fetcher. No auth required.
 */
export async function GET() {
  try {
    const daily = await fetchDailyGoalTrends();
    return NextResponse.json({ daily });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load daily trends";
    return NextResponse.json({ error: message, daily: [] }, { status: 200 }); // graceful fallback
  }
}
