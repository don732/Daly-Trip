create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  venmo text,
  created_at timestamptz default now()
);

create table if not exists trips (
  id text primary key,
  code text unique not null,
  organizer_id uuid references profiles,
  name text not null,
  location text,
  start_date date,
  end_date date,
  paid boolean default false,
  seed boolean default false,
  price numeric default 5,
  active_round_id text,
  document jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists trip_members (
  trip_id text references trips on delete cascade,
  user_id uuid references profiles,
  player_id text,
  role text check (role in ('organizer', 'player')),
  primary key (trip_id, user_id)
);

create table if not exists feed_posts (
  id uuid primary key default gen_random_uuid(),
  trip_id text references trips on delete cascade,
  author_player_id text,
  body text not null,
  reactions jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists trips_code_idx on trips (code);
create index if not exists trips_seed_idx on trips (seed);
create index if not exists feed_posts_trip_idx on feed_posts (trip_id, created_at desc);

create or replace function generate_trip_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table feed_posts enable row level security;

create policy "profiles_read_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

create policy "trips_read_seed" on trips for select using (seed = true);
create policy "trips_read_member" on trips for select using (
  exists (
    select 1 from trip_members tm
    where tm.trip_id = trips.id and tm.user_id = auth.uid()
  )
);

create policy "trips_insert_anon_seed" on trips for insert with check (seed = true or organizer_id is null);
create policy "trips_update_member" on trips for update using (
  seed = true or exists (
    select 1 from trip_members tm
    where tm.trip_id = trips.id and tm.user_id = auth.uid()
  )
);

create policy "feed_read_trip" on feed_posts for select using (
  exists (select 1 from trips t where t.id = feed_posts.trip_id and (t.seed = true or exists (
    select 1 from trip_members tm where tm.trip_id = t.id and tm.user_id = auth.uid()
  )))
);

create policy "feed_insert_trip" on feed_posts for insert with check (
  exists (select 1 from trips t where t.id = feed_posts.trip_id)
);
