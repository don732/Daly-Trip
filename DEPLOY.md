# Daly Trips — Deploy

## Prerequisites

- VPS with Docker, Docker Compose, and host nginx (see `docker/dalytrips.com.nginx.example`)
- Supabase project with schema applied (`supabase/delta_existing_project.sql` or full migrations)
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

Phone auth is optional. Anon sync works with current RLS on `trips`.

## Deploy

**Automatic:** push to `main`. CI runs `npm test` + `npm run build`, then SSH deploy.

**Manual on VPS:**

```bash
cd /path/to/daly-trip
bash scripts/vps-deploy.sh
```

## Post-deploy smoke test (create and join)

| Step | Device A (organizer) | Device B (player) |
|------|----------------------|-------------------|
| 1 | Open `/` → **CREATE AN EVENT** | — |
| 2 | Complete headcount → **PAY $X** → event details → create | — |
| 3 | Copy join code from invite screen (or Feed QR) | Open `/join?code=XXXXXX` |
| 4 | Enter the trip; header shows **Live** | Claim a roster slot → confirm join |
| 5 | Play → change a score on hole 1 | Board tab updates within ~1–2 s |

If Device B does not update:

- Confirm both devices hit the same Supabase project (rebuilt after `.env` change)
- Check browser console for Realtime errors
- Verify the `trips` row updates `updated_at` when A scores
- Clear site data / localStorage if a stale trip blocks join

If sync shows **Sync error**, hover the pill for the message. Common fixes: wrong anon key, RLS blocking upsert, or Realtime not enabled.

## Post-ship hardening (later)

- Tighten `trips_read_by_code` RLS
- Wire `trip_members` when auth ships
- Real Stripe checkout API (`VITE_CHECKOUT_API_URL`)
- Order of Merit from `merit_standings` in Supabase
