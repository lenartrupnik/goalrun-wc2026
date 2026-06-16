-- =============================================================================
-- GoalRun WC2026 — Initial schema
-- Paste into Supabase SQL Editor or run via: supabase db push
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_display_name_length CHECK (char_length(trim(display_name)) BETWEEN 1 AND 80)
);

COMMENT ON TABLE public.profiles IS 'Public runner profiles linked 1:1 with auth.users';
COMMENT ON COLUMN public.profiles.display_name IS 'Shown on leaderboard';

CREATE INDEX profiles_display_name_idx ON public.profiles (display_name);

-- -----------------------------------------------------------------------------
-- runs
-- -----------------------------------------------------------------------------
CREATE TABLE public.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  distance_km NUMERIC(8, 2) NOT NULL,
  run_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  notes TEXT,
  activity_type TEXT NOT NULL DEFAULT 'run',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT runs_distance_positive CHECK (distance_km > 0),
  CONSTRAINT runs_distance_max CHECK (distance_km <= 999.99),
  CONSTRAINT runs_notes_length CHECK (notes IS NULL OR char_length(notes) <= 500),
  CONSTRAINT runs_activity_type_check CHECK (activity_type IN ('run', 'bike'))
);

COMMENT ON TABLE public.runs IS 'Individual activity logs (runs full km, bike rides count ½ km toward totals/leaderboard)';

CREATE INDEX runs_user_id_idx ON public.runs (user_id);
CREATE INDEX runs_run_date_idx ON public.runs (run_date DESC);
CREATE INDEX runs_user_date_idx ON public.runs (user_id, run_date DESC);

-- -----------------------------------------------------------------------------
-- global_stats (singleton row for WC goal tally)
-- -----------------------------------------------------------------------------
CREATE TABLE public.global_stats (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  tournament TEXT NOT NULL DEFAULT 'FIFA World Cup 2026',
  total_goals INTEGER NOT NULL DEFAULT 0,
  matches_played INTEGER NOT NULL DEFAULT 0,
  last_goal_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT global_stats_singleton CHECK (id = 1),
  CONSTRAINT global_stats_total_goals_non_negative CHECK (total_goals >= 0),
  CONSTRAINT global_stats_matches_non_negative CHECK (matches_played >= 0)
);

COMMENT ON TABLE public.global_stats IS 'Live World Cup goal counter; community runs target 1 km per goal';
COMMENT ON COLUMN public.global_stats.total_goals IS 'Target km for % complete calculations';