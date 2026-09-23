-- Execute in the Supabase SQL Editor as postgres, after photo-history.sql.
-- Seeds three past election days of test photos for one existing profile
-- (by pseudo), to exercise get_my_photo_history()'s pending/won/lost states
-- and the /participation history list. Creates no Auth account.
begin;
do $$
declare
  target_pseudo text := 'Ely';
  target_user uuid;
  voters uuid[];
  microwave_id uuid := 'b70e5100-0000-4000-8000-000000000101';
  d1 date; -- most recent closed day: 2 votes, no reservation -> "Perdue"
  d2 date; -- middle closed day: 3 votes, a reservation      -> "Gagnée"
  d3 date; -- oldest closed day: 0 votes, no reservation      -> "Perdue"
begin
  select id into target_user from public.profiles where pseudo = target_pseudo limit 1;
  if target_user is null then
    select id into target_user from public.profiles where pseudo ilike '%' || target_pseudo || '%' limit 1;
  end if;
  if target_user is null then
    raise exception 'Aucun profil dont le pseudo contient "%" n''a été trouvé.', target_pseudo;
  end if;

  select coalesce(array_agg(id), '{}') into voters
  from (select id from public.profiles where id <> target_user order by id limit 3) v;
  if array_length(voters, 1) is null then
    voters := array[target_user]; -- solo test account: fall back to a self-vote
  end if;

  -- Keep the original dates when rerunning the seed.
  select date into d1 from public.reservations where id = 'b70e5100-0000-4000-8000-000000000201';
  if d1 is null then
    d1 := (now() at time zone 'Europe/Paris')::date - 1;
    -- Use three empty historical days so real photos aren't mixed with tests.
    while exists (
      select 1 from public.photos p where p.user_id = target_user
        and p.created_at >= ((d1 - 6) + time '10:00') at time zone 'Europe/Paris'
        and p.created_at < (d1 + time '10:00') at time zone 'Europe/Paris'
    ) or exists (
      select 1 from public.reservations r where r.user_id = target_user and r.date between d1 - 4 and d1
    ) loop
      d1 := d1 - 5;
    end loop;
  end if;
  d2 := d1 - 2;
  d3 := d1 - 4;

  insert into public.microwaves(id, nom) values
    (microwave_id, '[TEST HISTORIQUE] Micro-ondes')
  on conflict (id) do nothing;

  -- A photo posted at (X-1)+12:00 Paris buckets to election_day X, the same
  -- rule get_my_photo_history() / list_closed_elections() apply:
  -- ((created_at at time zone 'Europe/Paris' - interval '10 hours')::date + 1).
  insert into public.photos(id, user_id, url, legende, created_at) values
    ('b70e5100-0000-4000-8000-000000000001', target_user,
     'https://picsum.photos/seed/histo-perdue/640/480', '[TEST HISTORIQUE] Deux votes, pas gagné',
     ((d1 - 1) + time '12:00') at time zone 'Europe/Paris'),
    ('b70e5100-0000-4000-8000-000000000002', target_user,
     'https://picsum.photos/seed/histo-gagnee/640/480', '[TEST HISTORIQUE] Trois votes, gagné',
     ((d2 - 1) + time '12:00') at time zone 'Europe/Paris'),
    ('b70e5100-0000-4000-8000-000000000003', target_user,
     'https://picsum.photos/seed/histo-zero/640/480', '[TEST HISTORIQUE] Aucun vote',
     ((d3 - 1) + time '12:00') at time zone 'Europe/Paris')
  on conflict (id) do nothing;

  -- Votes have no id of their own here: clear this seed's votes first so
  -- rerunning the script doesn't pile up duplicates and inflate the counts.
  delete from public.votes where photo_id in (
    'b70e5100-0000-4000-8000-000000000001',
    'b70e5100-0000-4000-8000-000000000002',
    'b70e5100-0000-4000-8000-000000000003'
  );
  insert into public.votes(photo_id, voter_id, created_at) values
    ('b70e5100-0000-4000-8000-000000000001', voters[1 + 0 % array_length(voters,1)], (d1 + time '11:00') at time zone 'Europe/Paris'),
    ('b70e5100-0000-4000-8000-000000000001', voters[1 + 1 % array_length(voters,1)], (d1 + time '15:00') at time zone 'Europe/Paris'),
    ('b70e5100-0000-4000-8000-000000000002', voters[1 + 0 % array_length(voters,1)], (d2 + time '10:30') at time zone 'Europe/Paris'),
    ('b70e5100-0000-4000-8000-000000000002', voters[1 + 1 % array_length(voters,1)], (d2 + time '13:00') at time zone 'Europe/Paris'),
    ('b70e5100-0000-4000-8000-000000000002', voters[1 + 2 % array_length(voters,1)], (d2 + time '18:00') at time zone 'Europe/Paris');

  insert into public.reservations(id, user_id, microwave_id, date, created_at) values
    ('b70e5100-0000-4000-8000-000000000201', target_user, microwave_id, d2 + 1,
     ((d2 + 1) + time '10:01') at time zone 'Europe/Paris')
  on conflict (id) do nothing;

  raise notice 'Historique de test pour "%": % (2 votes, perdue) · % (3 votes, gagnée) · % (0 vote, perdue).',
    target_pseudo, d1, d2, d3;

  -- Verification, in the same transaction: read the seed back exactly as
  -- get_my_photo_history() would return it to that profile once logged in.
  perform set_config('request.jwt.claim.sub', target_user::text, true);
end;
$$;
select election_day, votes_count, votes_closed, won, legende
from public.get_my_photo_history()
where legende like '[TEST HISTORIQUE]%'
order by election_day desc;
commit;
