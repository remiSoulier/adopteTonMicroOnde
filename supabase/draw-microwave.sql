-- Run after roles.sql and microwave-admin.sql.
begin;
create table if not exists public.microwave_draws (
  closing_day date primary key,
  performed_by uuid not null,
  created_at timestamptz not null default now(),
  assigned_count integer not null check(assigned_count >= 0)
);
alter table public.microwave_draws enable row level security;
revoke all on public.microwave_draws from public, anon, authenticated;

create or replace function public.draw_microwave(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  target_day date := ((now() at time zone 'Europe/Paris') - interval '10 hours')::date;
  vote_end timestamptz;
  vote_start timestamptz;
  photo_start timestamptz;
  candidate record;
  appliance uuid;
  assigned integer := 0;
  previous_count integer;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() or coalesce(public.get_my_role(),0) <> 3 then
    raise exception 'Accès réservé au superadmin connecté.' using errcode='42501';
  end if;
  vote_end := (target_day + time '10:00') at time zone 'Europe/Paris';
  vote_start := ((target_day-1) + time '10:00') at time zone 'Europe/Paris';
  photo_start := ((target_day-2) + time '10:00') at time zone 'Europe/Paris';

  -- Same lock order as admin_delete_microwave; also blocks concurrent inserts.
  lock table public.reservations in share row exclusive mode;
  lock table public.microwaves in share row exclusive mode;
  if coalesce(public.get_my_role(),0) <> 3 then
    raise exception 'Accès réservé aux superadmins.' using errcode='42501';
  end if;
  select d.assigned_count into previous_count from public.microwave_draws d where d.closing_day=target_day;
  if found then
    return jsonb_build_object('status','already_done','closing_day',target_day,'assigned_count',previous_count);
  end if;

  if not exists(select 1 from public.microwaves m where m.is_active and m.deleted_at is null
    and not exists(select 1 from public.reservations r where r.microwave_id=m.id and (r.date=target_day or r.date is null))) then
    return jsonb_build_object('status','no_devices','closing_day',target_day,'assigned_count',0);
  end if;

  for candidate in
    with scores as (
      select p.id, p.user_id, p.created_at, count(distinct v.voter_id) as score
      from public.photos p
      join public.votes v on v.photo_id=p.id and v.created_at >= vote_start and v.created_at < vote_end
      where p.created_at >= photo_start and p.created_at < vote_start
      group by p.id,p.user_id,p.created_at
    ), best_photo as (
      select s.*, row_number() over(partition by s.user_id order by s.score desc,s.created_at,s.id) as position
      from scores s where s.score>0
    )
    select b.* from best_photo b where b.position=1
      and not exists(select 1 from public.reservations r where r.user_id=b.user_id and (r.date=target_day or r.date is null))
    order by b.score desc,b.created_at,b.id
  loop
    select m.id into appliance from public.microwaves m
    where m.is_active and m.deleted_at is null
      and not exists(select 1 from public.reservations r where r.microwave_id=m.id and (r.date=target_day or r.date is null))
    order by m.nom,m.id limit 1;
    if not found then exit; end if;
    insert into public.reservations(id,microwave_id,user_id,date,created_at)
    values(gen_random_uuid(),appliance,candidate.user_id,target_day,now());
    assigned := assigned+1;
  end loop;
  if assigned=0 then
    return jsonb_build_object('status','no_candidates','closing_day',target_day,'assigned_count',0);
  end if;
  insert into public.microwave_draws(closing_day,performed_by,assigned_count) values(target_day,p_user_id,assigned);
  return jsonb_build_object('status','completed','closing_day',target_day,'assigned_count',assigned);
end;
$$;
revoke all on function public.draw_microwave(uuid) from public,anon,authenticated;
grant execute on function public.draw_microwave(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
