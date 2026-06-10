# GoalRun WC2026 — Every Goal = 1km

A production-ready, open-source running challenge app for FIFA World Cup 2026. For every goal scored in the tournament, each participant runs **1 km**. Track personal progress and compete on a realtime leaderboard with friends.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

## Features

- **Landing page** — Hero, challenge explanation, live tournament stats preview
- **Supabase Auth** — Email/password signup + Google OAuth
- **Dashboard** — Global goals counter, total km required, personal progress ring
- **Log Run** — Quick form to record distance with confetti on success
- **Realtime Leaderboard** — Rank, name, km run, % complete (Supabase Realtime)
- **World Cup API** — Polls [worldcup26.ir](https://worldcup26.ir) every 2 minutes via Vercel Cron
- **Dark/green football theme** — Responsive, mobile-first, framer-motion animations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Auth & DB | Supabase (Postgres, Auth, Realtime) |
| Icons | lucide-react |
| Animations | framer-motion, react-confetti |
| Dates | date-fns |
| Deployment | Vercel (frontend) + Supabase (backend) |

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier)
- npm or yarn

### 1. Clone and install

```bash
git clone https://github.com/lenartrupnik/goalrun-wc2026.git
cd goalrun-wc2026
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. Choose a name (e.g. `goalrun-wc2026`), set a database password, pick a region
3. Wait for the project to provision (~2 minutes)

### 3. Run database migration

1. In Supabase Dashboard → **SQL Editor** → **New query**
2. Copy the entire contents of `supabase/migrations/20260610000000_combined_paste.sql`
3. Click **Run**

This creates:
- `profiles`, `runs`, `global_stats` tables
- `leaderboard` and `community_progress` views
- RLS policies, signup trigger, Realtime publication, seed data

### 4. Enable Realtime (if migration fails on publication)

Dashboard → **Database** → **Replication** → enable for:
- `runs`
- `global_stats`
- `profiles`

### 5. Configure Auth

**Email auth** (enabled by default):
- Dashboard → **Authentication** → **Providers** → Email → enabled

**Google OAuth** (optional):
1. [Google Cloud Console](https://console.cloud.google.com) → Create OAuth 2.0 credentials
2. Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Supabase → **Authentication** → **Providers** → Google → paste Client ID & Secret

**Site URL** (required for OAuth):
- Supabase → **Authentication** → **URL Configuration**
- Site URL: `http://localhost:3000` (dev) or your Vercel URL (prod)
- Redirect URLs: add `http://localhost:3000/auth/callback` and `https://your-app.vercel.app/auth/callback`

### 6. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in values from Supabase → **Project Settings** → **API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
WORLDCUP_API_URL=https://worldcup26.ir
CRON_SECRET=your-random-secret-string
```

> **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. It bypasses RLS.

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Sync World Cup goals manually (dev):**

```bash
curl http://localhost:3000/api/worldcup/sync
```

In development, the sync endpoint works without `CRON_SECRET`. In production, it requires `Authorization: Bearer <CRON_SECRET>`.

## World Cup API Integration

The app uses the free open-source [World Cup 2026 API](https://worldcup26.ir) by [rezarahiminia/worldcup2026](https://github.com/rezarahiminia/worldcup2026).

### How it works

1. **Vercel Cron** calls `GET /api/worldcup/sync` every 2 minutes (`vercel.json`)
2. The route fetches `https://worldcup26.ir/get/games` (all 104 matches)
3. Total goals = sum of `parseInt(home_score) + parseInt(away_score)` across all games
4. Results are written to `global_stats` via service-role client
5. All clients receive updates via **Supabase Realtime** on `global_stats`

### API reference

| Endpoint | Purpose |
|----------|---------|
| `GET /get/games` | All matches with scores (primary) |
| `GET /get/groups` | Group standings |
| `GET /health` | API health check |

No authentication required for read endpoints. Rate limit: ~100 req/second.

### Manual goal update (fallback)

If the external API is down, update directly in Supabase SQL Editor:

```sql
UPDATE public.global_stats
SET total_goals = 42,
    matches_played = 15,
    last_goal_at = NOW(),
    updated_at = NOW()
WHERE id = 1;
```

All connected clients will see the update via Realtime.

## Database Schema

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | FK to auth.users |
| display_name | TEXT | Shown on leaderboard |
| avatar_url | TEXT | Optional |

### `runs`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to profiles |
| distance_km | NUMERIC | Distance logged |
| run_date | DATE | When the run happened |
| notes | TEXT | Optional |

### `global_stats` (singleton, id = 1)
| Column | Type | Description |
|--------|------|-------------|
| total_goals | INTEGER | WC goals scored |
| matches_played | INTEGER | Finished matches |
| last_goal_at | TIMESTAMPTZ | Last goal timestamp |

### `leaderboard` (view)
Returns: `rank`, `user_id`, `name`, `km_run`, `percent_complete`, `wc_goal_target`

**Percent complete** = `km_run / total_goals × 100` (capped at 100%, 0% when no goals yet)

## RLS Policies

| Table | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|----------------------|
| profiles | Everyone | Own row only |
| runs | Everyone | Own runs only |
| global_stats | Everyone | Blocked (service role only) |

## Deployment

### Deploy to Vercel (frontend)

1. Push code to GitHub
2. [vercel.com/new](https://vercel.com/new) → Import repository
3. Framework preset: **Next.js**
4. Add environment variables (same as `.env.local`, with production URLs):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` → `https://your-app.vercel.app`
   - `CRON_SECRET` → generate a random string
   - `WORLDCUP_API_URL` → `https://worldcup26.ir`
5. Deploy

Vercel Cron (configured in `vercel.json`) runs `/api/worldcup/sync` every 2 minutes. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when the env var is set.

### Update Supabase for production

1. **Authentication** → **URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: add `https://your-app.vercel.app/auth/callback`
2. Verify Realtime is enabled on `runs`, `global_stats`, `profiles`

### Verify deployment

1. Visit your Vercel URL — landing page loads
2. Sign up / log in → dashboard appears
3. Log a run → appears on leaderboard
4. Trigger sync: `curl -H "Authorization: Bearer <CRON_SECRET>" https://your-app.vercel.app/api/worldcup/sync`
5. Goal count updates on dashboard via Realtime

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── (auth)/login, signup        # Auth pages
│   ├── dashboard/                  # Protected dashboard
│   ├── auth/callback/              # OAuth callback
│   └── api/worldcup/sync, stats    # Goals sync + public stats
├── components/
│   ├── landing/                    # Hero, challenge, stats preview
│   ├── auth/                       # Login/signup forms
│   ├── dashboard/                  # Goals, progress, leaderboard
│   ├── layout/                     # Header, footer, nav
│   └── ui/                         # Button, Card, Input, etc.
├── lib/
│   ├── supabase/                   # Browser, server, admin clients
│   ├── hooks/                      # Realtime hooks
│   ├── actions/                    # Server actions (auth, runs)
│   └── api/                        # World Cup API fetcher
└── types/                          # TypeScript types
supabase/migrations/                # SQL schema
```

## Seeding Test Data

After signing up a few test users, seed runs via SQL:

```sql
-- Replace USER_UUID with actual auth.users id
INSERT INTO public.runs (user_id, distance_km, run_date, notes)
VALUES
  ('USER_UUID', 5.0, CURRENT_DATE, 'Test run'),
  ('USER_UUID', 3.5, CURRENT_DATE - 1, 'Easy jog');
```

Seed goals for testing:

```sql
UPDATE public.global_stats
SET total_goals = 10, matches_played = 5, updated_at = NOW()
WHERE id = 1;
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## License

MIT — Open source, free to use and modify.

## Credits

- World Cup data: [worldcup26.ir](https://worldcup26.ir) / [rezarahiminia/worldcup2026](https://github.com/rezarahiminia/worldcup2026)
- Built with Next.js, Supabase, Tailwind CSS