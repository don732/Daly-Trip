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
