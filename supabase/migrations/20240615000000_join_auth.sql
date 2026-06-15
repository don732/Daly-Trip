create or replace function preview_trip_by_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t trips%rowtype;
  players jsonb;
begin
  select * into t from trips where upper(code) = upper(trim(p_code));
  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p->>'id',
        'nick', p->>'nick',
        'hcp', coalesce((p->>'hcp')::int, 18),
        'claimed', exists (
          select 1 from trip_members tm
          where tm.trip_id = t.id and tm.player_id = p->>'id'
        )
      )
    ),
    '[]'::jsonb
  )
  into players
  from jsonb_array_elements(t.document->'players') as p;

  return jsonb_build_object(
    'id', t.id,
    'code', t.code,
    'name', t.name,
    'location', coalesce(t.location, ''),
    'players', players
  );
end;
$$;

create or replace function join_trip_by_code(
  p_code text,
  p_player_id text default null,
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
  target_id text := nullif(trim(p_player_id), '');
  new_doc jsonb;
  players jsonb;
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

  if target_id is null then
    select p->>'id' into target_id
    from jsonb_array_elements(t.document->'players') as p
    where (p->>'nick') ~* '^Player [0-9]+$' or (p->>'nick') = 'Organizer'
    order by (p->>'nick') = 'Organizer' desc
    limit 1;
  end if;

  if target_id is null then
    raise exception 'no roster slot available';
  end if;

  select coalesce(
    jsonb_agg(
      case
        when p->>'id' = target_id then
          p
          || jsonb_build_object(
            'nick', coalesce(nullif(trim(p_nick), ''), p->>'nick'),
            'hcp', coalesce(p_hcp, (p->>'hcp')::int, 18),
            'venmo', coalesce(nullif(trim(p_venmo), ''), p->>'venmo', '')
          )
        else p
      end
    ),
    '[]'::jsonb
  )
  into players
  from jsonb_array_elements(t.document->'players') as p;

  new_doc := jsonb_set(t.document, '{players}', players);

  insert into trip_members (trip_id, user_id, player_id, role)
  values (t.id, v_uid, target_id, 'player');

  update trips
  set document = new_doc, updated_at = now()
  where id = t.id;

  return new_doc;
end;
$$;

create or replace function register_trip_organizer(p_trip_id text, p_player_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update trips
  set organizer_id = v_uid, updated_at = now()
  where id = p_trip_id and (organizer_id is null or organizer_id = v_uid);

  insert into trip_members (trip_id, user_id, player_id, role)
  values (p_trip_id, v_uid, p_player_id, 'organizer')
  on conflict (trip_id, user_id) do update
  set player_id = excluded.player_id, role = 'organizer';
end;
$$;

grant execute on function preview_trip_by_code(text) to anon, authenticated;
grant execute on function join_trip_by_code(text, text, text, int, text) to authenticated;
grant execute on function register_trip_organizer(text, text) to authenticated;
