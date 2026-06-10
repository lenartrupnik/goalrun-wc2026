# GoalRun WC2026 — Troubleshooting

## Auth errors

### `Unsupported provider: provider is not enabled`

**Cause:** User clicked Google OAuth but Google is not enabled in Supabase.

**Fix (current app state):** Use email/password. Google UI is intentionally hidden.

**Fix (to enable Google later):**
1. Supabase → Authentication → Providers → Google → Enable
2. Google Cloud OAuth redirect: `https://<ref>.supabase.co/auth/v1/callback`
3. Uncomment `SocialAuthButtons` in `login/page.tsx` and `signup/page.tsx`

### Login redirects to wrong URL / OAuth callback fails

**Cause:** `NEXT_PUBLIC_SITE_URL` or Supabase redirect URLs don't match deployed URL.

**Fix:**
- Vercel env: `NEXT_PUBLIC_SITE_URL=https://exact-vercel-url.vercel.app`
- Supabase redirect: `https://exact-vercel-url.vercel.app/auth/callback`
- Redeploy

### Email signup works but can't log in

**Cause:** Supabase email confirmation enabled.

**Fix:** Check email for confirm link, or disable confirm in Supabase → Auth → Providers → Email.

---

## Vercel build failures

### `Property 'initial' does not exist on type 'GlobalGoalsCardProps'`

**Cause:** GitHub has stale code; `GlobalGoalsCard` expects `stats` not `initial`.

**Fix:** Ensure `DashboardClient.tsx` has:
```tsx
<GlobalGoalsCard stats={stats} />
<Leaderboard entries={leaderboard} currentUserId={...} totalGoals={stats.total_goals} />
```
Commit, push, redeploy.

### `Failed to compile` TypeScript errors

1. Run `npm run build` locally
2. Fix errors
3. `git push origin main`

### Build shows warnings but succeeds

Ignore unless exit code is 1:
- Next.js telemetry notice
- Webpack cache big strings
- Supabase Edge Runtime `process.version` in middleware

---

## Vercel cron / deployment

### `Hobby accounts are limited to daily cron jobs`

**Cause:** `vercel.json` had `*/2 * * * *` (every 2 minutes).

**Fix:** Keep `vercel.json` as `{}`. App uses client polling instead (commit `c813297`).

### User thought "only 1 cron job" on free plan

**Clarification:** Hobby allows 100 crons but each can only run **once per day**. Frequency was the issue, not count.

---

## Runtime / data issues

### Goals stuck at 0

**Expected** before World Cup matches start.

**If matches are live:**
- Someone must have dashboard open (polling triggers sync)
- Or manually update `global_stats` in Supabase SQL
- Or set up external cron hitting `/api/worldcup/sync` with `CRON_SECRET`

### Leaderboard not updating

1. Check Realtime enabled on `runs`, `profiles` in Supabase Replication
2. Check RLS migration ran successfully
3. Hard refresh dashboard

### `global_stats` not updating from API

1. Verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel (not anon key)
2. Check Vercel function logs for `/api/worldcup/sync` errors
3. Test API: `curl https://worldcup26.ir/get/games`

---

## Git / deploy sync issues

### Vercel fails but local build passes

**Cause:** Fix exists locally but wasn't pushed.

```bash
git status
git push origin main
```

Compare: `git show origin/main:src/components/dashboard/DashboardClient.tsx`

---

## Domain

### Do I need to buy a domain?

No. `https://<project>.vercel.app` is free and sufficient.

### Added custom domain — auth broke

Update all three:
- Vercel `NEXT_PUBLIC_SITE_URL`
- Supabase Site URL
- Supabase Redirect URLs

Then redeploy.