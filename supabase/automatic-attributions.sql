-- Exécuter après roles.sql, microwave-admin.sql et repair-election-after-table-removal.sql.
begin;
alter table public.reservations add column if not exists is_simulation boolean not null default false;
-- Fonction interne : même classement pour la clôture normale et la simulation.
create or replace function public.assign_election(p_day date, p_replace boolean default false)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  start_at timestamptz := (p_day + time '10:00') at time zone 'Europe/Paris';
  end_at timestamptz := ((p_day+1) + time '10:00') at time zone 'Europe/Paris';
  photo_start timestamptz := ((p_day-1) + time '10:00') at time zone 'Europe/Paris';
  candidate record;
  appliance uuid;
  assigned integer := 0;
begin
  lock table public.reservations in share row exclusive mode;
  lock table public.microwaves in share row exclusive mode;
  lock table public.votes in share mode;
  if p_replace then
    delete from public.reservations where date=p_day+1;
  elsif exists(select 1 from public.reservations where date=p_day+1 and not is_simulation) then
    return 0;
  else
    delete from public.reservations where date=p_day+1 and is_simulation;
  end if;
  for candidate in
    with scores as (
      select p.id,p.user_id,p.created_at,count(distinct v.voter_id) as score
      from public.photos p join public.votes v on v.photo_id=p.id
        and v.created_at>=start_at and v.created_at<least(end_at,now())
      where p.created_at>=photo_start and p.created_at<start_at
      group by p.id,p.user_id,p.created_at
    ), ranked as (
      select s.*,row_number() over(partition by user_id order by score desc,created_at,id) as position
      from scores s
    )
    select * from ranked where position=1
      and not exists(select 1 from public.reservations r where r.user_id=ranked.user_id and (r.date=p_day+1 or r.date is null))
    order by score desc,created_at,id
  loop
    select m.id into appliance from public.microwaves m
    where m.is_active and m.deleted_at is null
      and not exists(select 1 from public.reservations r where r.microwave_id=m.id and (r.date=p_day+1 or r.date is null))
    order by m.nom,m.id limit 1;
    if not found then exit; end if;
    insert into public.reservations(id,microwave_id,user_id,date,created_at,is_simulation)
    values(gen_random_uuid(),appliance,candidate.user_id,p_day+1,now(),p_replace);
    assigned:=assigned+1;
  end loop;
  return assigned;
end;
$$;
revoke all on function public.assign_election(date,boolean) from public,anon,authenticated;

create or replace function public.simulate_election_close(p_start timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  d date := ((now() at time zone 'Europe/Paris')-interval '10 hours')::date;
  n integer;
begin
  if auth.uid() is null or coalesce(public.get_my_role(),0)<>3 then
    raise exception 'Accès réservé au superadmin.' using errcode='42501';
  end if;
  if p_start is distinct from ((d+time '10:00') at time zone 'Europe/Paris') then
    raise exception 'La période a changé. Actualise la page.' using errcode='22023';
  end if;
  n:=public.assign_election(d,true);
  return jsonb_build_object('assigned_count',n,'date',d+1);
end;
$$;
revoke all on function public.simulate_election_close(timestamptz) from public,anon,authenticated;
grant execute on function public.simulate_election_close(timestamptz) to authenticated;
notify pgrst,'reload schema';
commit;

-- Activer Supabase Cron (pg_cron) avant d'exécuter cette partie.
-- Chaque minute, traite la dernière période terminée ; les réservations
-- existantes empêchent de refaire une attribution. L'heure de Paris gère le DST.
select cron.schedule('automatic-election-attributions','* * * * *',
  $$select public.assign_election(((now() at time zone 'Europe/Paris')-interval '10 hours')::date-1,false);$$);
