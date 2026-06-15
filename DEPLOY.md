# Daly Trips — Deploy

## Prerequisites

- VPS with Docker, Docker Compose, and host nginx (see `docker/dalytrips.com.nginx.example`)
- Supabase project with schema applied (`supabase/migrations/` or `supabase/delta_existing_project.sql` + auth migrations)
- GitHub repo secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_PRIVATE_KEY`, `VPS_DEPLOY_PATH`

## VPS environment

On the server, in the repo root:

```bash
cp .env.vps.example .env
```

Edit `.env`:

```env
WEB_HOST_PORT=8081
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Vite bakes `VITE_*` vars at **Docker build time**. After changing `.env`, rebuild:

```bash
bash scripts/vps-deploy.sh
```

## Supabase dashboard

| Setting | Value |
|---------|-------|
| Site URL | `https://dalytrips.com` |
| Redirect URLs | `https://dalytrips.com/**` |
| Realtime | `trips` table in `supabase_realtime` publication |
| Email auth | Enable Email provider (OTP). Phone/SMS can be added later via Twilio. |

### Apply auth migrations (required)

Run on your Supabase project SQL editor, in order:

1. [`supabase/migrations/20240615000000_join_auth.sql`](supabase/migrations/20240615000000_join_auth.sql) — join/preview RPCs
2. [`supabase/migrations/20240615000001_auth_rls.sql`](supabase/migrations/20240615000001_auth_rls.sql) — member-only trip access

**Before step 2:** delete or backfill legacy trips with `organizer_id is null` if they were created under anon sync. New trips require a signed-in organizer.

## Deploy

**Automatic:** push to `main`. CI runs `npm test` + `npm run build`, then SSH deploy.

**Manual on VPS:**

```bash
cd /path/to/daly-trip
bash scripts/vps-deploy.sh
```

## Post-deploy smoke test (sign-in + create + join)

| Step | Device A (organizer) | Device B (player) |
|------|----------------------|-------------------|
| 1 | Open `/` → **CREATE AN EVENT** | — |
| 2 | Sign in with email OTP | — |
| 3 | Complete headcount → **PAY $X** → event details → create | — |
| 4 | Copy join code from invite screen | Open `/join?code=XXXXXX` |
| 5 | Sign in if prompted; enter the trip; header shows **Live** | Sign in → claim roster slot → confirm join |
| 6 | Play → change a score on hole 1 | Board tab updates within ~1–2 s |

If Device B does not update:

- Confirm both devices signed in (menu shows masked email)
- Confirm both hit the same Supabase project (rebuilt after `.env` change)
- Verify auth migrations applied and RLS is member-scoped
- Check browser console for Realtime or RLS errors
- Clear site data / localStorage if a stale trip blocks join

If sync shows **Sync error**, hover the pill for the message. Common fixes: wrong anon key, RLS blocking upsert, missing `trip_members` row, or Realtime not enabled.

## Deferred product work

- Real Stripe checkout (`VITE_CHECKOUT_API_URL` + server endpoint)
- Order of Merit from `merit_standings` in Supabase (Clubhouse today uses local empty merit)
- Add-player beyond organizer headcount (`addPlayerToTrip`)
- Named invite lists (code + auth is the current invite model)
- iOS PNG home-screen icon (SVG provided today)
