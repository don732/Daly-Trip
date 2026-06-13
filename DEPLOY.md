# Daly Trips — Deploy & Live Demo

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

Phone auth is optional for the demo. Anon sync works with current RLS on seed trips.

## Deploy

**Automatic:** push to `main`. CI runs `npm test` + `npm run build`, then SSH deploy.

**Manual on VPS:**

```bash
cd /path/to/daly-trip
bash scripts/vps-deploy.sh
```

## Seed the cloud demo (one time)

1. Open `https://dalytrips.com`
2. Tap **Explore the demo**
3. Header should show sync pill **Live** (not "Local only")
4. In Supabase Table Editor → `trips`:
   - One row with `id = seed-demo-boys26`
   - `code = BOYS26`
   - `seed = true`

If sync shows **Sync error**, hover the pill for the message. Common fixes: wrong anon key, RLS blocking upsert, or Realtime not enabled.

## Two-phone smoke test

| Step | Device A | Device B |
|------|----------|----------|
| 1 | Explore demo | Join → code `BOYS26` or scan QR from Feed tab |
| 2 | Both show **Live** in header | Same |
| 3 | Play → change a score on hole 1 | Board tab updates within ~1–2 s |

If Device B does not update:

- Confirm both devices hit the same Supabase project (rebuilt after `.env` change)
- Check browser console for Realtime errors
- Verify `trips` row updates `updated_at` when A scores
- Clear site data / localStorage if an old demo trip with code `BOYS26` but a different id blocks join

## Demo trip identity

The demo always uses:

- Trip id: `seed-demo-boys26`
- Join code: `BOYS26`

Re-opening the demo reuses the same id so cloud upserts do not conflict on the unique `code` column.

## Post-ship hardening (later)

- Tighten `trips_read_by_code` RLS
- Wire `trip_members` when auth ships
- Real Stripe checkout API (`VITE_CHECKOUT_API_URL`)
