-- =============================================================================
-- GoalRun WC2026 — Realtime + seed data
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enable Realtime (leaderboard reacts to runs + goal updates)
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Replica identity for filtered realtime subscriptions (optional but recommended)
ALTER TABLE public.runs REPLICA IDENTITY FULL;
ALTER TABLE public.global_stats REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- -----------------------------------------------------------------------------
-- Seed global_stats (WC2026 kickoff placeholder)
-- -----------------------------------------------------------------------------
INSERT INTO public.global_stats (
  id,
  tournament,
  total_goals,
  matches_played,
  last_goal_at,
  updated_at
)
VALUES (
  1,
  'FIFA World Cup 2026',
  0,
  0,
  NULL,
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET
  tournament = EXCLUDED.tournament,
  updated_at = NOW();