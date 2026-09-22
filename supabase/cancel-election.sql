-- Run after roles.sql, microwave-admin.sql and draw-microwave.sql.
begin;
create table if not exists public.cancelled_elections (
  voting_day date primary key,
  cancelled_by uuid not null,
  cancelled_at timestamptz not null default now()
);
alter table public.cancelled_elections enable row level security;
revoke all on public.cancelled_elections from public,anon,authenticated;

create or replace function public.get_current_election_status()
returns jsonb language sql stable security definer set search_path = '' as $$
  with period as (select ((now() at time zone 'Europe/Paris')-interval '10 hours')::date as day)
  select jsonb_build_object('voting_day',day,'cancelled',exists(
    select 1 from public.cancelled_elections c where c.voting_day=period.day
  )) from period;
$$;

create or replace function public.cancel_current_election(p_voting_day date)
returns void language plpgsql security definer set search_path = '' as $$
declare current_day date;
begin
  if auth.uid() is null or coalesce(public.get_my_role(),0)<>3 then
    raise exception 'Annulation réservée aux superadmins.' using errcode='42501';
  end if;
  -- Wait for ongoing votes/attributions before making cancellation effective.
  lock table public.reservations in share row exclusive mode;
  lock table public.votes in share row exclusive mode;
  current_day := ((clock_timestamp() at time zone 'Europe/Paris')-interval '10 hours')::date;
  if p_voting_day is null or p_voting_day<>current_day then
    raise exception 'La période a changé. Actualise la page.' using errcode='22023';
  end if;
  if coalesce(public.get_my_role(),0)<>3 then
    raise exception 'Annulation réservée aux superadmins.' using errcode='42501';
  end if;
  if exists(select 1 from public.reservations r where r.date=current_day+1)
    or exists(select 1 from public.microwave_draws d where d.closing_day=current_day+1) then
    raise exception 'Des attributions existent déjà pour cette élection.' using errcode='23514';
  end if;
  insert into public.cancelled_elections(voting_day,cancelled_by) values(current_day,auth.uid())
  on conflict(voting_day) do nothing;
end;
$$;

create or replace function public.guard_cancelled_election_vote()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.cancelled_elections c where
    c.voting_day=((clock_timestamp() at time zone 'Europe/Paris')-interval '10 hours')::date
    or c.voting_day=((new.created_at at time zone 'Europe/Paris')-interval '10 hours')::date
    or c.voting_day=(select ((p.created_at at time zone 'Europe/Paris')-interval '10 hours')::date+1 from public.photos p where p.id=new.photo_id)
  ) then raise exception 'Cette élection a été annulée.' using errcode='23514'; end if;
  return new;
end;
$$;
drop trigger if exists guard_cancelled_election_vote on public.votes;
create trigger guard_cancelled_election_vote before insert or update on public.votes
for each row execute function public.guard_cancelled_election_vote();

create or replace function public.guard_cancelled_election_reservation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.cancelled_elections c where c.voting_day=new.date-1) then
    raise exception 'Cette élection a été annulée : attribution interdite.' using errcode='23514';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_cancelled_election_reservation on public.reservations;
create trigger guard_cancelled_election_reservation before insert or update on public.reservations
for each row execute function public.guard_cancelled_election_reservation();

revoke all on function public.get_current_election_status() from public,anon,authenticated;
grant execute on function public.get_current_election_status() to anon,authenticated;
revoke all on function public.cancel_current_election(date) from public,anon,authenticated;
grant execute on function public.cancel_current_election(date) to authenticated;
revoke all on function public.guard_cancelled_election_vote() from public,anon,authenticated;
revoke all on function public.guard_cancelled_election_reservation() from public,anon,authenticated;
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
    if exists(select 1 from public.cancelled_elections c where c.voting_day=target_day-1) then
      return jsonb_build_object('status','cancelled','closing_day',target_day,'assigned_count',0);
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
create or replace function public.is_election_cancelled(p_voting_day date)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.cancelled_elections where voting_day=p_voting_day);
$$;
revoke all on function public.is_election_cancelled(date) from public,anon,authenticated;
grant execute on function public.is_election_cancelled(date) to authenticated;
notify pgrst,'reload schema';
commit;
