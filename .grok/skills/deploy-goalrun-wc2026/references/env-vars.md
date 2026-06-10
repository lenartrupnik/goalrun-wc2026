# GoalRun WC2026 — Environment Variables

## Vercel / `.env.local`

| Variable | Required | Secret? | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | No | Supabase project URL (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes* | No | Anon/publishable key (browser-safe, RLS applies) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | No | Alias for publishable key — either name works via `src/lib/supabase/env.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **YES** | Updates `global_stats`; bypasses RLS — server only |
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | No | Public app URL for OAuth redirects (`/auth/callback`) |
| `WORLDCUP_API_URL` | No | No | Defaults to `https://worldcup26.ir` |
| `CRON_SECRET` | No | Yes | Only if using external cron; bypasses 90s rate limit |
| `NEXT_TELEMETRY_DISABLED` | No | No | Set to `1` to silence Next.js telemetry build notice |

\* One of the two publishable/anon key vars is required.

## Example — local dev

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
WORLDCUP_API_URL=https://worldcup26.ir
```

## Example — Vercel production

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://goalrun-wc2026.vercel.app
WORLDCUP_API_URL=https://worldcup26.ir
```

## Where keys come from

Supabase Dashboard → **Project Settings** → **API**:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` / `publishable` key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (never prefix with `NEXT_PUBLIC_`)

## After changing env vars

Redeploy on Vercel (env changes require redeploy to take effect).

## Supabase dashboard mirrors

| Env var | Supabase setting |
|---------|------------------|
| `NEXT_PUBLIC_SITE_URL` | Auth → URL Configuration → Site URL |
| `{SITE_URL}/auth/callback` | Auth → URL Configuration → Redirect URLs |