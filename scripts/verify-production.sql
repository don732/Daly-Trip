-- Production verification queries (Supabase SQL Editor)
-- Run after auth migrations and before go-live smoke test.

-- 1. Auth RLS policies present
select policyname, cmd from pg_policies where tablename = 'trips' order by policyname;
-- Expect: trips_insert_auth, trips_read_auth, trips_update_auth
-- Must NOT have trips_update_anon_document or trips_read_by_code (legacy anon policies)

-- 2. Join RPCs exist
select proname from pg_proc where proname in (
  'preview_trip_by_code',
  'join_trip_by_code',
  'register_trip_organizer',
  'add_player_to_trip'
);

-- 3. Realtime on trips
select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'trips';

-- 4. Recent trips have organizer + members
select t.id, t.code, t.organizer_id, count(tm.user_id) as members
from trips t
left join trip_members tm on tm.trip_id = t.id
group by t.id, t.code, t.organizer_id
order by t.created_at desc
limit 10;

-- 5. Profiles for auth users (sample)
select id, display_name, created_at from profiles order by created_at desc limit 10;

-- 6. Push subscriptions table (after 20240621000000 migration)
select count(*) as push_subscribers from push_subscriptions;
