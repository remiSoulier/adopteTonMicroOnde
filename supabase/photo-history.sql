begin;

-- Personal history: read-only, scoped to the calling user via auth.uid().
-- Reuses the same election-day bucketing as winners.sql
-- (((created_at at time zone 'Europe/Paris' - interval '10 hours')::date + 1))
-- so a photo's election_day here matches the "day" list_closed_elections
-- would group it under, and "won" matches get_election_winners' r.date=p_day+1.
create or replace function public.get_my_photo_history(p_limit integer default 12)
returns table(
  id uuid,
  url text,
  legende text,
  created_at timestamptz,
  election_day date,
  votes_count bigint,
  votes_closed boolean,
  won boolean
)
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Connexion requise.' using errcode='42501'; end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then p_limit := 12; end if;

  return query
  with mine as (
    select p.id, p.url, p.legende, p.created_at,
      ((p.created_at at time zone 'Europe/Paris' - interval '10 hours')::date + 1) as election_day
    from public.photos p
    where p.user_id = uid
  )
  select m.id, m.url, m.legende, m.created_at, m.election_day,
    coalesce(v.n, 0) as votes_count,
    ((m.election_day + 1) + time '10:00') at time zone 'Europe/Paris' <= now() as votes_closed,
    exists(
      select 1 from public.reservations r
      where r.user_id = uid and r.date = m.election_day + 1
    ) as won
  from mine m
  left join lateral (
    select count(*) as n from public.votes v where v.photo_id = m.id
  ) v on true
  order by m.created_at desc
  limit p_limit;
end;
$$;
revoke all on function public.get_my_photo_history(integer) from public, anon, authenticated;
grant execute on function public.get_my_photo_history(integer) to authenticated;

-- Lets a user pull back a submission before it has any vote on it. Once a
-- single vote exists the photo is left alone, even if the caller is the
-- owner, so a live ballot can't be yanked out from under voters.
create or replace function public.delete_my_photo(p_photo_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  owner uuid;
begin
  if uid is null then raise exception 'Connexion requise.' using errcode='42501'; end if;
  select p.user_id into owner from public.photos p where p.id = p_photo_id;
  if owner is null then raise exception 'Photo introuvable.' using errcode='P0002'; end if;
  if owner <> uid then raise exception 'Cette photo ne t''appartient pas.' using errcode='42501'; end if;
  if exists(select 1 from public.votes v where v.photo_id = p_photo_id) then
    raise exception 'Impossible de supprimer une photo déjà votée.' using errcode='55000';
  end if;
  delete from public.photos where id = p_photo_id;
end;
$$;
revoke all on function public.delete_my_photo(uuid) from public, anon, authenticated;
grant execute on function public.delete_my_photo(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
