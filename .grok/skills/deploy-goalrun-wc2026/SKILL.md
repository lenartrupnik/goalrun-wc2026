---
name: deploy-goalrun-wc2026
description: >
  Deploy and operate GoalRun WC2026 (Next.js 15 + Supabase + Vercel).
  Use when deploying, redeploying, configuring env vars, fixing Vercel build failures,
  Supabase auth/RLS, OAuth, cron limits, or domain setup for this repo.
  Triggers: "deploy goalrun", "vercel deploy", "supabase setup", "fix build",
  "/deploy-goalrun-wc2026", production issues on goalrun-wc2026.
---

# Deploy GoalRun WC2026

Agent playbook for deploying and maintaining **GoalRun WC2026** — a Next.js 15 + Supabase + Vercel running challenge app.

**Repo:** https://github.com/lenartrupnik/goalrun-wc2026

## Architecture (know this first)

```
worldcup26.ir/get/games
        ↓ (rate-limited, max 1 call / 90s)
/api/worldcup/sync  →  global_stats (Supabase, service role)
        ↓
Supabase Realtime  →  dashboard UI (goals + leaderboard)
```

- **Auth/DB/Realtime:** Supabase (free tier)
- **Frontend:** Vercel (Hobby/free)
- **Goals sync:** Client polling from dashboard (NOT Vercel Cron on Hobby)
- **OAuth:** Google is **disabled in UI** until enabled in Supabase

## Pre-deploy checklist

Run through in order. Do not skip Supabase before Vercel.

### 1. Supabase project

1. Create project at supabase.com/dashboard
2. **SQL Editor** → paste entire file:
   `supabase/migrations/20260610000000_combined_paste.sql` → Run
3. **Database → Replication** → enable Realtime on: `runs`, `global_stats`, `profiles`
4. **Authentication → Providers** → Email enabled (default)
5. **Authentication → URL Configuration** (set after Vercel deploy — see step 3)

### 2. Vercel deploy

1. Import GitHub repo `lenartrupnik/goalrun-wc2026`
2. Framework: **Next.js** (auto-detected)
3. Add environment variables (see `references/env-vars.md`)
4. Deploy — no custom domain required (free `*.vercel.app` works)

### 3. Post-deploy: Supabase auth URLs

Replace `your-app.vercel.app` with actual Vercel URL:

| Setting | Value |
|---------|-------|
| Site URL | `https://your-app.vercel.app` |
| Redirect URLs | `https://your-app.vercel.app/auth/callback` |

Also add `http://localhost:3000/auth/callback` for local dev.

### 4. Verify

- [ ] Landing page loads
- [ ] Email signup/login works
- [ ] Dashboard loads after login
- [ ] Log a run → appears on leaderboard
- [ ] Goal count visible (0 before tournament is OK)

## Environment variables

See `references/env-vars.md` for full table.

**Required in Vercel:**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   # or NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://<vercel-url>
WORLDCUP_API_URL=https://worldcup26.ir
```

**Optional:**

```
CRON_SECRET          # only for external cron (cron-job.org); NOT needed on Hobby
NEXT_TELEMETRY_DISABLED=1   # silences Next.js build telemetry notice
```

**Never commit:** `.env.local`, real keys. Only `.env.example` with placeholders.

## Domain guidance

- **Free:** Vercel assigns `https://<project>.vercel.app` — sufficient for friends challenge
- **Vercel does NOT give free custom domains** — buy separately (~$10–15/yr) if wanted
- Custom domain: Vercel → Settings → Domains → add DNS records at registrar
- After domain change: update `NEXT_PUBLIC_SITE_URL` + Supabase auth URLs + redeploy

## Vercel Hobby cron — critical constraint

**Do NOT add frequent crons to `vercel.json` on Hobby.**

| Plan | Cron limit |
|------|------------|
| Hobby | Max **once per day** per cron (not every 2 min) |
| Pro | Once per minute |

Current `vercel.json` is `{}` (empty) — intentional.

**Goals sync on Hobby:** dashboard clients poll `/api/worldcup/sync` every 90s. Server rate-limits external API to 1 call per 90s globally. Supabase Realtime propagates updates.

Trade-off: goals only refresh while someone has dashboard open. Acceptable for friends app.

## Known fixes (from git history)

Reference when debugging — these were real production issues:

| Commit | Problem | Fix |
|--------|---------|-----|
| `c813297` | Vercel Hobby rejects `*/2 * * * *` cron | Removed Vercel cron; client polling + 90s server rate limit |
| `9f6b84e` | Build fail: `GlobalGoalsCard` prop `initial` vs `stats` | Pass `stats={stats}` from `useGlobalStats()`; Leaderboard uses `entries` not `initial` |
| `36a99d4` | Google OAuth error: "provider is not enabled" | Commented out `SocialAuthButtons` + `AuthDivider` on login/signup pages |
| `2672dba` | README clone URL | `git clone https://github.com/lenartrupnik/goalrun-wc2026.git` |

**Always push fixes to GitHub** — Vercel builds from `main`, not local uncommitted files.

## Build warnings (safe to ignore)

These do **not** fail the build:

1. **Next.js telemetry notice** — set `NEXT_TELEMETRY_DISABLED=1` to silence
2. **Webpack "Serializing big strings"** — internal, harmless
3. **Supabase Edge Runtime `process.version`** — expected when `@supabase/ssr` runs in `middleware.ts`; auth still works

Only fix warnings if build exits with `Failed to compile` or `exit code 1`.

## OAuth (Google) — currently disabled

Google button is commented out in:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`

To re-enable later:
1. Google Cloud Console → OAuth client → redirect: `https://<ref>.supabase.co/auth/v1/callback`
2. Supabase → Auth → Providers → Google → enable + paste credentials
3. Uncomment `SocialAuthButtons` + `AuthDivider` in login/signup pages
4. Ensure `NEXT_PUBLIC_SITE_URL` and Supabase redirect URLs match production URL

Until then: **email/password only**.

## GitHub push workflow

```bash
git add <files>
git commit -m "description"
git push origin main
```

Vercel auto-redeploys on push to `main`.

**Verify remote matches local before debugging Vercel:**

```bash
git status                    # uncommitted local fixes won't deploy
git show origin/main:path     # compare file on GitHub vs local
npm run build                 # must pass locally first
```

## Manual goal update (fallback)

If World Cup API is down, update in Supabase SQL Editor:

```sql
UPDATE public.global_stats
SET total_goals = 10, matches_played = 5, updated_at = NOW()
WHERE id = 1;
```

## Agent workflow when user reports deploy issues

1. Read `git log --oneline -10` and compare to known fixes table above
2. Run `npm run build` locally — reproduce TypeScript errors before pushing
3. Check Vercel env vars match `references/env-vars.md`
4. Check Supabase auth URLs match `NEXT_PUBLIC_SITE_URL`
5. For auth errors: email vs OAuth — OAuth is disabled unless user re-enabled it
6. For stale goals: confirm dashboard is open (polling) or run manual SQL update
7. Push fix to `main` and confirm Vercel redeployed

## Reference files

- `references/env-vars.md` — full env var table
- `references/troubleshooting.md` — error → solution lookup
- `README.md` — user-facing setup guide