alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table feed_posts enable row level security;
alter table trip_payments enable row level security;
alter table merit_standings enable row level security;

drop policy if exists "profiles_read_own" on profiles;
create policy "profiles_read_own" on profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

drop policy if exists "trips_read_seed" on trips;
create policy "trips_read_seed" on trips for select using (seed = true);

drop policy if exists "trips_read_member" on trips;
create policy "trips_read_member" on trips for select using (
  exists (
    select 1 from trip_members tm
    where tm.trip_id = trips.id and tm.user_id = auth.uid()
  )
);

drop policy if exists "trips_read_by_code" on trips;
create policy "trips_read_by_code" on trips for select using (true);

drop policy if exists "trips_insert_anon" on trips;
create policy "trips_insert_anon" on trips for insert with check (organizer_id is null or organizer_id = auth.uid());

drop policy if exists "trips_update_seed" on trips;
create policy "trips_update_seed" on trips for update using (seed = true);

drop policy if exists "trips_update_member" on trips;
create policy "trips_update_member" on trips for update using (
  exists (
    select 1 from trip_members tm
    where tm.trip_id = trips.id and tm.user_id = auth.uid()
  )
);

drop policy if exists "trips_update_anon_document" on trips;
create policy "trips_update_anon_document" on trips for update using (organizer_id is null);

drop policy if exists "trip_members_read" on trip_members;
create policy "trip_members_read" on trip_members for select using (
  user_id = auth.uid() or exists (
    select 1 from trip_members tm where tm.trip_id = trip_members.trip_id and tm.user_id = auth.uid()
  )
);

drop policy if exists "feed_read_trip" on feed_posts;
create policy "feed_read_trip" on feed_posts for select using (
  exists (select 1 from trips t where t.id = feed_posts.trip_id and (t.seed = true or exists (
    select 1 from trip_members tm where tm.trip_id = t.id and tm.user_id = auth.uid()
  )))
);

drop policy if exists "feed_insert_trip" on feed_posts;
create policy "feed_insert_trip" on feed_posts for insert with check (
  exists (select 1 from trips t where t.id = feed_posts.trip_id)
);

drop policy if exists "trip_payments_read_own" on trip_payments;
create policy "trip_payments_read_own" on trip_payments for select using (user_id = auth.uid());

drop policy if exists "trip_payments_insert_own" on trip_payments;
create policy "trip_payments_insert_own" on trip_payments for insert with check (user_id = auth.uid());

drop policy if exists "merit_read_all" on merit_standings;
create policy "merit_read_all" on merit_standings for select using (true);
