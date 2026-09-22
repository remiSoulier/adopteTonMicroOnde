begin;

-- Read-only results. No reservation or winner is created by these functions.
create or replace function public.list_closed_elections(p_offset integer default 0)
returns table(day date, voting_start timestamptz, voting_end timestamptz, photo_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise.' using errcode='42501'; end if;
  if p_offset is null or p_offset < 0 or p_offset > 1000000 then raise exception 'Page invalide.'; end if;
  return query
  with dates as (
    select ((p.created_at at time zone 'Europe/Paris' - interval '10 hours')::date + 1) as d, count(*) as n
    from public.photos p group by 1
  ), all_days as (
    select d, n from dates
    union
    select distinct r.date-1, 0::bigint from public.reservations r
    where not exists (select 1 from dates d where d.d=r.date-1)
  )
  select d, (d + time '10:00') at time zone 'Europe/Paris',
    ((d + 1) + time '10:00') at time zone 'Europe/Paris', n
  from all_days
  where ((d + 1) + time '10:00') at time zone 'Europe/Paris' <= now()
    or exists(select 1 from public.reservations r where r.date=d+1)
  order by d desc limit 31 offset p_offset;
end;
$$;

create or replace function public.get_election_winners(p_day date)
returns table(reservation_id uuid, user_id uuid, pseudo text, photo_url text, legende text, microwave_name text)
language plpgsql stable security definer set search_path = '' as $$
declare
  start_at timestamptz;
  end_at timestamptz;
  submission_start timestamptz;
begin
  if auth.uid() is null then raise exception 'Connexion requise.' using errcode='42501'; end if;
  if p_day is null then raise exception 'Date invalide.'; end if;
  start_at := (p_day + time '10:00') at time zone 'Europe/Paris';
  end_at := ((p_day + 1) + time '10:00') at time zone 'Europe/Paris';
  submission_start := ((p_day - 1) + time '10:00') at time zone 'Europe/Paris';
  if end_at > now() and not exists(select 1 from public.reservations r where r.date=p_day+1) then
    raise exception 'Le vote est encore ouvert.' using errcode='22023';
  end if;

  -- Reservation date = closing day. Only existing assignments are returned.
  -- The schema does not record a winning photo ID: only display a photo when
  -- exactly one submission belongs to the user in this election's window.
  return query
  select r.id, r.user_id, coalesce(pr.pseudo, 'Utilisateur'),
    case when image.n=1 then image.url else null end,
    case when image.n=1 then image.caption else null end,
    coalesce(m.nom, 'Micro-ondes indisponible')
  from public.reservations r
  left join public.profiles pr on pr.id=r.user_id
  left join public.microwaves m on m.id=r.microwave_id
  left join lateral (
    select count(*) as n, min(p.url) as url, min(p.legende) as caption
    from public.photos p where p.user_id=r.user_id
      and p.created_at >= submission_start and p.created_at < start_at
  ) image on true
  where r.date=p_day+1
  order by m.nom, pr.pseudo, r.id;
end;
$$;
revoke all on function public.list_closed_elections(integer) from public, anon, authenticated;
revoke all on function public.get_election_winners(date) from public, anon, authenticated;
grant execute on function public.list_closed_elections(integer) to authenticated;
grant execute on function public.get_election_winners(date) to authenticated;
commit;
