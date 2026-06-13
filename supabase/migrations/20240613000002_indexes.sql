create index if not exists trips_code_idx on trips (code);
create index if not exists trips_seed_idx on trips (seed);
create index if not exists trips_updated_idx on trips (updated_at desc);
create index if not exists feed_posts_trip_idx on feed_posts (trip_id, created_at desc);
create index if not exists trip_payments_trip_idx on trip_payments (trip_id, created_at desc);
