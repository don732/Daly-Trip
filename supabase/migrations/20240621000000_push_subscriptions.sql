create table if not exists push_subscriptions (
  user_id uuid primary key references profiles on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy push_subscriptions_own on push_subscriptions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
