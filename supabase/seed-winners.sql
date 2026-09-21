-- Execute in the Supabase SQL Editor as postgres, after winners.sql.
-- Uses two existing profiles; creates no Auth accounts and changes no roles.
begin;
do $$
declare
  participants uuid[];
  closing_day date;
begin
  select array_agg(id order by id) into participants
  from (select id from public.profiles order by id limit 2) p;
  if coalesce(array_length(participants, 1), 0) < 2 then
    raise exception 'Il faut au moins deux profils existants pour ce jeu de test.';
  end if;

  -- Keep the original dates when rerunning the seed.
  select date into closing_day from public.reservations
  where id = 'a80e5100-0000-4000-8000-000000000201';
  if closing_day is null then
    closing_day := (now() at time zone 'Europe/Paris')::date - 1;
    -- Use three empty historical days so real results are not mixed with tests.
    while exists (
      select 1 from public.reservations r
      where r.date between closing_day - 2 and closing_day
    ) or exists (
      select 1 from public.photos p
      where p.created_at >= ((closing_day - 4) + time '10:00') at time zone 'Europe/Paris'
        and p.created_at < ((closing_day - 1) + time '10:00') at time zone 'Europe/Paris'
    ) loop
      closing_day := closing_day - 3;
    end loop;
  end if;

  insert into public.microwaves(id, nom) values
    ('a80e5100-0000-4000-8000-000000000101', '[TEST GAGNANTS] Micro-ondes Orange'),
    ('a80e5100-0000-4000-8000-000000000102', '[TEST GAGNANTS] Micro-ondes Bleu')
  on conflict (id) do nothing;

  -- Submission window: closing day minus 2 at 10h -> minus 1 at 10h.
  insert into public.photos(id, user_id, url, legende, created_at) values
    ('a80e5100-0000-4000-8000-000000000001', participants[1],
     'https://picsum.photos/seed/winner-orange/640/480', '[TEST GAGNANTS] Premier gagnant',
     ((closing_day - 2) + time '12:00') at time zone 'Europe/Paris'),
    ('a80e5100-0000-4000-8000-000000000002', participants[2],
     'https://picsum.photos/seed/winner-blue/640/480', '[TEST GAGNANTS] Deuxième gagnant',
     ((closing_day - 2) + time '14:00') at time zone 'Europe/Paris'),
    ('a80e5100-0000-4000-8000-000000000003', participants[1],
     'https://picsum.photos/seed/winner-solo/640/480', '[TEST GAGNANTS] Un seul gagnant',
     ((closing_day - 3) + time '12:00') at time zone 'Europe/Paris'),
    ('a80e5100-0000-4000-8000-000000000004', participants[2],
     'https://picsum.photos/seed/winner-pending/640/480', '[TEST GAGNANTS] Sans attribution',
     ((closing_day - 4) + time '12:00') at time zone 'Europe/Paris')
  on conflict (id) do nothing;

  insert into public.reservations(id, user_id, microwave_id, date, created_at) values
    ('a80e5100-0000-4000-8000-000000000201', participants[1],
     'a80e5100-0000-4000-8000-000000000101', closing_day,
     (closing_day + time '10:01') at time zone 'Europe/Paris'),
    ('a80e5100-0000-4000-8000-000000000202', participants[2],
     'a80e5100-0000-4000-8000-000000000102', closing_day,
     (closing_day + time '10:01') at time zone 'Europe/Paris'),
    ('a80e5100-0000-4000-8000-000000000203', participants[1],
     'a80e5100-0000-4000-8000-000000000101', closing_day - 1,
     ((closing_day - 1) + time '10:01') at time zone 'Europe/Paris')
  on conflict (id) do nothing;

  raise notice 'Tests : % = deux gagnants ; % = un gagnant ; % = sans attribution.',
    closing_day, closing_day - 1, closing_day - 2;
end;
$$;
commit;

-- The dates below are the card titles to look for on /gagnants.
select date as jour_de_cloture, count(*) as attributions_test
from public.reservations
where id in (
  'a80e5100-0000-4000-8000-000000000201',
  'a80e5100-0000-4000-8000-000000000202',
  'a80e5100-0000-4000-8000-000000000203'
)
group by date
union all
select date - 2, 0 from public.reservations
where id = 'a80e5100-0000-4000-8000-000000000201'
order by jour_de_cloture desc;
