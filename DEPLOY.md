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
| Email auth | Enable Email provider (OTP). Phone/SMS: enable Phone provider + Twilio; set `VITE_PHONE_AUTH_ENABLED=true` in build env. |

### Custom SMTP (required for branded OTP emails)

Supabase’s built-in mailer is rate-limited (~2/hour) and sends magic links by default. For production-style OTP:

1. **SMTP provider** — e.g. [Brevo](https://www.brevo.com) (free ~300/day) or Resend (~100/day). Sender: `invites@dalytrips.com`.
2. **Supabase → Authentication → SMTP** — enable custom SMTP with your provider credentials.
3. **Email template** — Supabase → Authentication → Email Templates → **Magic Link**:
   - Paste HTML from [`supabase/email-templates/magic-link-otp.html`](supabase/email-templates/magic-link-otp.html)
   - Must include `{{ .Token }}` and **must not** include `{{ .ConfirmationURL }}` (otherwise users get a link instead of a code)
   - Subject suggestion: `Your Daly Trips sign-in code`

The app auto-verifies when all 6 digits are entered (`OtpInput` + `AuthPanel`).

### Apply auth migrations (required)

Run on your Supabase project SQL editor, in order:

1. [`supabase/migrations/20240615000000_join_auth.sql`](supabase/migrations/20240615000000_join_auth.sql) — join/preview RPCs
2. [`supabase/migrations/20240615000001_auth_rls.sql`](supabase/migrations/20240615000001_auth_rls.sql) — member-only trip access
3. [`supabase/migrations/20240616000000_add_player_rpc.sql`](supabase/migrations/20240616000000_add_player_rpc.sql) — overflow join (`add_player_to_trip`)
4. [`supabase/migrations/20240616000001_merit_policies.sql`](supabase/migrations/20240616000001_merit_policies.sql) — merit upsert policies
5. [`supabase/migrations/20240620000000_fix_organizer_trips_rls.sql`](supabase/migrations/20240620000000_fix_organizer_trips_rls.sql) — **required if create trip returns HTTP 403**
6. [`supabase/migrations/20240621000000_push_subscriptions.sql`](supabase/migrations/20240621000000_push_subscriptions.sql) — Web Push subscription storage

**Before step 2:** delete or backfill legacy trips with `organizer_id is null` if they were created under anon sync. New trips require a signed-in organizer.

### Production verification

Run [`scripts/verify-production.sql`](scripts/verify-production.sql) in the SQL editor after migrations. Confirm Stripe webhook receives `checkout.session.completed` on a test payment. After deploy, confirm `https://dalytrips.com/apple-touch-icon.png` loads (iOS home-screen icon).

### Optional env (Vite)

| Variable | Purpose |
|----------|---------|
| `VITE_PHONE_AUTH_ENABLED=true` | Show SMS sign-in tab (requires Supabase Phone + Twilio) |
| `VITE_STARTER_API_URL` | Override Starter API (default: same-origin `POST /api/starter` → `{ text }`) |
| `VITE_VAPID_PUBLIC_KEY` | Web Push VAPID public key (enables push subscribe on trip load) |

### Starter + Push APIs (Edge Functions)

v11 uses same-origin routes. **Host nginx** (not the Docker static container) must proxy `/api/*` to Supabase — see [`docker/dalytrips.com.nginx.example`](docker/dalytrips.com.nginx.example). Local dev uses Vite `server.proxy` in [`vite.config.ts`](vite.config.ts).

**Deploy functions:**

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY=... \
  VAPID_PRIVATE_KEY=... \
  VAPID_SUBJECT=mailto:invites@dalytrips.com \
  OPENAI_API_KEY=sk-...   # optional — Starter LLM replies

supabase functions deploy starter-reply
supabase functions deploy push-subscribe
supabase functions deploy push-send
```

| Route | Function | Contract |
|-------|----------|----------|
| `POST /api/starter` | `starter-reply` | `{ history, context }` → `{ text }` |
| `POST /api/push/subscribe` | `push-subscribe` | `{ endpoint, keys }` + `Authorization: Bearer <jwt>` |
| `POST /api/push/send` | `push-send` | `{ toUserId }` or `{ tripId, title, body, excludeUserId? }` |

Generate VAPID keys: `npx web-push generate-vapid-keys`. Set public key in Vite build (`VITE_VAPID_PUBLIC_KEY`) and both keys in Supabase secrets.

### Stripe checkout (Edge Functions)

Payment uses Supabase Edge Functions — no extra VPS service.

**Deploy functions** (requires [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... SITE_URL=https://dalytrips.com
supabase functions deploy create-checkout
supabase functions deploy verify-checkout
supabase functions deploy stripe-webhook
```

**Stripe Dashboard → Webhooks** — add endpoint:

`https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`

Events: `checkout.session.completed`

| Secret | Where |
|--------|-------|
| `STRIPE_SECRET_KEY` | Supabase secrets (test or live) |
| `STRIPE_WEBHOOK_SECRET` | Supabase secrets (from webhook endpoint) |
| `SITE_URL` | `https://dalytrips.com` |

Flow: organizer signs in → **PAY $X** → Stripe Checkout → return to `/plan?checkout=success&session_id=...` → event details → create trip. Without Supabase env vars, pay step uses a local stub (dev only).

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
| 0 | Open `/` → **EXPLORE THE DEMO** (optional, no sign-in) | — |
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

**HTTP 403 on `POST /rest/v1/trips` (error 42501):** run migration [`20240620000000_fix_organizer_trips_rls.sql`](supabase/migrations/20240620000000_fix_organizer_trips_rls.sql). Confirm [`20240615000001_auth_rls.sql`](supabase/migrations/20240615000001_auth_rls.sql) ran first. In SQL editor: `select policyname, cmd from pg_policies where tablename = 'trips';` — expect `trips_insert_auth`, `trips_read_auth`, `trips_update_auth`.

## Still optional / ops

- Named invite lists (code + auth is the current invite model)
- iOS PNG home-screen icon (SVG provided today)
- Stripe live keys + webhook on production domain
