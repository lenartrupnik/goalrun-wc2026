-- GoalRun WC2026 — Complete schema (paste into Supabase SQL Editor)
-- Tables: profiles, runs, global_stats
-- Views: leaderboard, community_progress
-- RLS, triggers, realtime, seed data

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- User profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User run logs
CREATE TABLE IF NOT EXISTS public.runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  distance_km NUMERIC(6, 2) NOT NULL CHECK (distance_km > 0 AND distance_km <= 999),
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runs_user_id ON public.runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_run_date ON public.runs(run_date DESC);

-- Global World Cup stats (singleton row, id = 1)
CREATE TABLE IF NOT EXISTS public.global_stats (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_goals INTEGER NOT NULL DEFAULT 0 CHECK (total_goals >= 0),
  matches_played INTEGER NOT NULL DEFAULT 0 CHECK (matches_played >= 0),
  last_goal_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update profiles.updated_at on change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Leaderboard: rank, name, km run, % complete
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true)
AS
SELECT
  ROW_NUMBER() OVER (
    ORDER BY COALESCE(SUM(r.distance_km), 0) DESC,
             MAX(r.created_at) DESC NULLS LAST,
             p.display_name ASC
  )::INTEGER AS rank,
  p.id AS user_id,
  p.display_name AS name,
  p.avatar_url,
  COALESCE(SUM(r.distance_km), 0)::NUMERIC(10, 2) AS km_run,
  CASE
    WHEN gs.total_goals = 0 THEN 0::NUMERIC(5, 2)
    ELSE LEAST(
      ROUND((COALESCE(SUM(r.distance_km), 0) / gs.total_goals) * 100, 2),
      100
    )
  END AS percent_complete,
  gs.total_goals AS wc_goal_target
FROM public.profiles p
CROSS JOIN public.global_stats gs
LEFT JOIN public.runs r ON r.user_id = p.id
WHERE gs.id = 1
GROUP BY p.id, p.display_name, p.avatar_url, gs.total_goals;

-- Community aggregate progress
CREATE OR REPLACE VIEW public.community_progress
WITH (security_invoker = true)
AS
SELECT
  gs.total_goals,
  gs.matches_played,
  gs.last_goal_at,
  gs.updated_at,
  COALESCE(SUM(r.distance_km), 0)::NUMERIC(10, 2) AS total_km_logged,
  (gs.total_goals * 1)::INTEGER AS total_km_required,
  CASE
    WHEN gs.total_goals = 0 THEN 0::NUMERIC(5, 2)
    ELSE LEAST(
      ROUND((COALESCE(SUM(r.distance_km), 0) / gs.total_goals) * 100, 2),
      100
    )
  END AS community_percent_complete
FROM public.global_stats gs
LEFT JOIN public.runs r ON TRUE
WHERE gs.id = 1
GROUP BY gs.id, gs.total_goals, gs.matches_played, gs.last_goal_at, gs.updated_at;

-- Paginated leaderboard RPC
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  km_run NUMERIC,
  percent_complete NUMERIC,
  wc_goal_target INTEGER
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    l.rank,
    l.user_id,
    l.name,
    l.avatar_url,
    l.km_run,
    l.percent_complete,
    l.wc_goal_target
  FROM public.leaderboard l
  ORDER BY l.rank ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_stats ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone can read, users manage own row
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Runs: everyone can read (leaderboard), users manage own runs
DROP POLICY IF EXISTS "runs_select_all" ON public.runs;
CREATE POLICY "runs_select_all" ON public.runs
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "runs_insert_own" ON public.runs;
CREATE POLICY "runs_insert_own" ON public.runs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "runs_update_own" ON public.runs;
CREATE POLICY "runs_update_own" ON public.runs
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "runs_delete_own" ON public.runs;
CREATE POLICY "runs_delete_own" ON public.runs
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Global stats: everyone reads, no client writes (use service role)
DROP POLICY IF EXISTS "global_stats_select_all" ON public.global_stats;
CREATE POLICY "global_stats_select_all" ON public.global_stats
  FOR SELECT TO anon, authenticated
  USING (true);

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.runs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.runs TO authenticated;
GRANT SELECT ON public.global_stats TO anon, authenticated;
GRANT SELECT ON public.leaderboard TO anon, authenticated;
GRANT SELECT ON public.community_progress TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard TO anon, authenticated;

-- =============================================================================
-- REALTIME
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- =============================================================================
-- SEED DATA
-- =============================================================================
INSERT INTO public.global_stats (id, total_goals, matches_played, last_goal_at)
VALUES (1, 0, 0, NULL)
ON CONFLICT (id) DO NOTHING;