create table if not exists trip_payments (
  id uuid primary key default gen_random_uuid(),
  trip_id text references trips on delete cascade,
  user_id uuid references profiles,
  amount numeric not null,
  stripe_session_id text,
  status text check (status in ('pending', 'paid', 'failed', 'refunded')) default 'pending',
  created_at timestamptz default now()
);

create table if not exists merit_standings (
  user_id uuid references profiles,
  nick text not null,
  points numeric default 0,
  trips_count integer default 0,
  updated_at timestamptz default now(),
  primary key (user_id, nick)
);

create index if not exists trip_payments_trip_idx on trip_payments (trip_id, created_at desc);

alter table trip_payments enable row level security;
alter table merit_standings enable row level security;

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

drop policy if exists "trips_read_by_code" on trips;
create policy "trips_read_by_code" on trips for select using (true);

drop policy if exists "trips_update_anon_document" on trips;
create policy "trips_update_anon_document" on trips for update using (organizer_id is null);

drop policy if exists "trip_payments_read_own" on trip_payments;
create policy "trip_payments_read_own" on trip_payments for select using (user_id = auth.uid());

drop policy if exists "trip_payments_insert_own" on trip_payments;
create policy "trip_payments_insert_own" on trip_payments for insert with check (user_id = auth.uid());

drop policy if exists "merit_read_all" on merit_standings;
create policy "merit_read_all" on merit_standings for select using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'trips'
  ) then
    alter publication supabase_realtime add table trips;
  end if;
end $$;
