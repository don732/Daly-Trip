# Supabase schema

## Layout

| Path | Purpose |
|------|---------|
| `migrations/` | Incremental migrations (Supabase CLI). Run once per file, in order. |
| `schema.sql` | Full snapshot for reading or empty-project bootstrap. Do not re-run on existing DBs. |
| `delta_existing_project.sql` | Safe patch for a project that already has the base schema. Run in SQL Editor. |

## Fresh Supabase project

**Option A — Supabase CLI**

```bash
supabase link --project-ref YOUR_REF
supabase db push
```

**Option B — SQL Editor**

Run each file in `migrations/` in numeric order on an empty database.

## Existing project (you hit "policy already exists")

Do **not** re-run `schema.sql` or the full migration chain.

Run **`delta_existing_project.sql`** once in the Supabase SQL Editor (same content as `migrations/20240614000000_payments_merit_delta.sql`). It only adds:

- `trip_payments`, `merit_standings`
- New RLS policies (drop + recreate, idempotent)
- Realtime on `trips` (skipped if already enabled)

## Future changes

Add a new timestamped file under `migrations/`, e.g.:

```
migrations/20240615000000_add_storage_avatars.sql
```

Never edit migrations that have already been applied to production. Append only.

After adding a migration, update `schema.sql` so it stays a complete reference snapshot.

## Edge Functions (Stripe)

| Function | JWT | Purpose |
|----------|-----|---------|
| `create-checkout` | required | Creates Stripe Checkout session for signed-in organizer |
| `verify-checkout` | public | Verifies `session_id` after redirect |
| `stripe-webhook` | public | Records `trip_payments` on `checkout.session.completed` |

Deploy and secrets: see [`DEPLOY.md`](../DEPLOY.md) → Stripe checkout.
