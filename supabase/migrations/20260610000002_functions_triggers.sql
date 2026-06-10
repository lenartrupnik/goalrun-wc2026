-- =============================================================================
-- GoalRun WC2026 — Functions, triggers, leaderboard view
-- =============================================================================

-- -----------------------------------------------------------------------------
-- updated_at helper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER runs_set_updated_at
  BEFORE UPDATE ON public.runs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER global_stats_set_updated_at
  BEFORE UPDATE ON public.global_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-create profile on signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fallback_name TEXT;
BEGIN
  fallback_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'display_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
    split_part(COALESCE(NEW.email, 'runner'), '@', 1),
    'Runner'
  );

  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    fallback_name,
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Leaderboard view
-- rank, display name, total km, % toward WC goal target
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true)
AS
WITH user_totals AS (
  SELECT
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(r.distance_km), 0)::NUMERIC(10, 2) AS total_km,
    COUNT(r.id)::BIGINT AS run_count,
    MAX(r.run_date) AS last_run_date
  FROM public.profiles p
  LEFT JOIN public.runs r ON r.user_id = p.id
  GROUP BY p.id, p.display_name, p.avatar_url
),
goal_target AS (
  SELECT COALESCE(gs.total_goals, 0) AS total_goals
  FROM public.global_stats gs
  WHERE gs.id = 1
)
SELECT
  ROW_NUMBER() OVER (
    ORDER BY ut.total_km DESC, ut.last_run_date DESC NULLS LAST, ut.display_name ASC
  )::INTEGER AS rank,
  ut.user_id,
  ut.display_name AS name,
  ut.avatar_url,
  ut.total_km AS km_run,
  ut.run_count,
  ut.last_run_date,
  gt.total_goals AS wc_goal_target,
  CASE
    WHEN gt.total_goals <= 0 THEN 0::NUMERIC(6, 2)
    ELSE LEAST(100, ROUND((ut.total_km / gt.total_goals::NUMERIC) * 100, 2))
  END AS percent_complete
FROM user_totals ut
CROSS JOIN goal_target gt
ORDER BY rank;

COMMENT ON VIEW public.leaderboard IS
  'Ranked runners by total km; percent_complete = km_run / global_stats.total_goals * 100 (capped at 100)';

-- Optional RPC for paginated leaderboard (handy for mobile clients)
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  km_run NUMERIC(10, 2),
  run_count BIGINT,
  last_run_date DATE,
  wc_goal_target INTEGER,
  percent_complete NUMERIC(6, 2)
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
    l.run_count,
    l.last_run_date,
    l.wc_goal_target,
    l.percent_complete
  FROM public.leaderboard l
  ORDER BY l.rank
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(INTEGER, INTEGER) TO authenticated, anon;

-- Community aggregate (sum of all runners vs WC goals)
CREATE OR REPLACE VIEW public.community_progress
WITH (security_invoker = true)
AS
SELECT
  COALESCE(SUM(r.distance_km), 0)::NUMERIC(12, 2) AS community_km_run,
  gs.total_goals AS wc_goal_target,
  COUNT(DISTINCT r.user_id)::INTEGER AS active_runners,
  CASE
    WHEN gs.total_goals <= 0 THEN 0::NUMERIC(6, 2)
    ELSE LEAST(100, ROUND((COALESCE(SUM(r.distance_km), 0) / gs.total_goals::NUMERIC) * 100, 2))
  END AS community_percent_complete
FROM public.global_stats gs
LEFT JOIN public.runs r ON TRUE
WHERE gs.id = 1
GROUP BY gs.total_goals;

COMMENT ON VIEW public.community_progress IS
  'Aggregate community km vs World Cup goal target';