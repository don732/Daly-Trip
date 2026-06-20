drop policy if exists "merit_upsert_own" on merit_standings;
create policy "merit_upsert_own" on merit_standings
  for insert with check (auth.uid() = user_id);

drop policy if exists "merit_update_own" on merit_standings;
create policy "merit_update_own" on merit_standings
  for update using (auth.uid() = user_id);
