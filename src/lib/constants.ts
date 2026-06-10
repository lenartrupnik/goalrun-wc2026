export const APP_NAME = "GoalRun WC2026";
export const APP_TAGLINE = "Every Goal = 1km";
export const KM_PER_GOAL = 1;
export const WORLDCUP_API_URL =
  process.env.WORLDCUP_API_URL ?? "https://worldcup26.ir";
export const POLL_INTERVAL_MS = 90_000; // client polls every 90s
export const SYNC_MIN_INTERVAL_MS = 90_000; // server skips external API if synced recently