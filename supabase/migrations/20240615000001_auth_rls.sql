drop policy if exists "trips_read_by_code" on trips;
drop policy if exists "trips_update_anon_document" on trips;
drop policy if exists "trips_insert_anon" on trips;

create policy "trips_insert_auth" on trips
  for insert
  with check (auth.uid() is not null and organizer_id = auth.uid());

create policy "trips_read_auth" on trips
  for select
  using (
    seed = true
    or exists (
      select 1 from trip_members tm
      where tm.trip_id = trips.id and tm.user_id = auth.uid()
    )
  );

drop policy if exists "trips_read_seed" on trips;
drop policy if exists "trips_read_member" on trips;

create policy "trips_update_auth" on trips
  for update
  using (
    seed = true
    or exists (
      select 1 from trip_members tm
      where tm.trip_id = trips.id and tm.user_id = auth.uid()
    )
  );

drop policy if exists "trips_update_seed" on trips;
drop policy if exists "trips_update_member" on trips;
