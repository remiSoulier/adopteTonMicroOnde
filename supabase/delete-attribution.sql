begin;

create or replace function public.superadmin_delete_attribution(p_reservation_id uuid, p_day date)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or coalesce(public.get_my_role(),0) <> 3 then
    raise exception 'Suppression réservée aux superadmins.' using errcode='42501';
  end if;
  if p_reservation_id is null or p_day is null
    or ((p_day+1)+time '10:00') at time zone 'Europe/Paris' > now() then
    raise exception 'Journée invalide ou vote encore ouvert.' using errcode='22023';
  end if;
  -- Serialize with the attribution function and administrative deletion.
  lock table public.reservations in share row exclusive mode;
  if coalesce(public.get_my_role(),0) <> 3 then
    raise exception 'Suppression réservée aux superadmins.' using errcode='42501';
  end if;
  delete from public.reservations
    where id=p_reservation_id and date=p_day+1;
  return found;
end;
$$;
revoke all on function public.superadmin_delete_attribution(uuid,date) from public,anon,authenticated;
grant execute on function public.superadmin_delete_attribution(uuid,date) to authenticated;
notify pgrst, 'reload schema';
commit;
