-- =============================================================================
-- GoalRun WC2026 — Row Level Security
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_stats ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_select_anon"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- runs
-- -----------------------------------------------------------------------------
CREATE POLICY "runs_select_authenticated"
  ON public.runs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "runs_select_anon"
  ON public.runs
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "runs_insert_own"
  ON public.runs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "runs_update_own"
  ON public.runs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "runs_delete_own"
  ON public.runs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- global_stats (read-only for clients; writes via service role / edge function)
-- -----------------------------------------------------------------------------
CREATE POLICY "global_stats_select_authenticated"
  ON public.global_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "global_stats_select_anon"
  ON public.global_stats
  FOR SELECT
  TO anon
  USING (true);

-- No INSERT/UPDATE/DELETE policies for authenticated/anon.
-- Update goals from a Supabase Edge Function or cron using SUPABASE_SERVICE_ROLE_KEY.

-- -----------------------------------------------------------------------------
-- Grants for views / RPC
-- -----------------------------------------------------------------------------
GRANT SELECT ON public.leaderboard TO authenticated, anon;
GRANT SELECT ON public.community_progress TO authenticated, anon;