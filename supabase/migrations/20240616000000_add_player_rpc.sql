create or replace function add_player_to_trip(
  p_code text,
  p_nick text default null,
  p_hcp int default 18,
  p_venmo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  t trips%rowtype;
  new_doc jsonb;
  new_player jsonb;
  new_id text;
  slot text;
  pine_ids jsonb;
  sand_ids jsonb;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into t from trips where upper(code) = upper(trim(p_code)) for update;
  if not found then
    return null;
  end if;

  if exists (select 1 from trip_members where trip_id = t.id and user_id = v_uid) then
    return t.document;
  end if;

  new_id := 'p_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  slot := case
    when jsonb_array_length(t.document->'teams'->'pine'->'ids') <= jsonb_array_length(t.document->'teams'->'sand'->'ids')
    then 'pine' else 'sand'
  end;

  new_player := jsonb_build_object(
    'id', new_id,
    'name', coalesce(nullif(trim(p_nick), ''), 'New Player'),
    'nick', coalesce(nullif(trim(p_nick), ''), 'New Player'),
    'hcp', coalesce(p_hcp, 18),
    'team', slot,
    'venmo', coalesce(nullif(trim(p_venmo), ''), '')
  );

  new_doc := jsonb_set(t.document, '{players}', (t.document->'players') || new_player);

  if slot = 'pine' then
    pine_ids := (new_doc->'teams'->'pine'->'ids') || to_jsonb(new_id);
    sand_ids := new_doc->'teams'->'sand'->'ids';
  else
    pine_ids := new_doc->'teams'->'pine'->'ids';
    sand_ids := (new_doc->'teams'->'sand'->'ids') || to_jsonb(new_id);
  end if;

  new_doc := jsonb_set(new_doc, '{teams,pine,ids}', pine_ids);
  new_doc := jsonb_set(new_doc, '{teams,sand,ids}', sand_ids);

  insert into trip_members (trip_id, user_id, player_id, role)
  values (t.id, v_uid, new_id, 'player');

  update trips set document = new_doc, updated_at = now() where id = t.id;

  return new_doc;
end;
$$;

grant execute on function add_player_to_trip(text, text, int, text) to authenticated;
