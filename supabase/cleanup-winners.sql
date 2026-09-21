-- Removes only the fixture rows. Profiles and Auth users are never deleted.
-- Refuses cleanup if another feature has begun using the fixture records.
begin;
do $$
begin
  if exists (select 1 from public.votes where photo_id in (
    'a80e5100-0000-4000-8000-000000000001', 'a80e5100-0000-4000-8000-000000000002',
    'a80e5100-0000-4000-8000-000000000003', 'a80e5100-0000-4000-8000-000000000004'
  )) then raise exception 'Des votes utilisent ces photos de test : nettoyage annulé.'; end if;
  if exists (select 1 from public.reservations
    where microwave_id in ('a80e5100-0000-4000-8000-000000000101','a80e5100-0000-4000-8000-000000000102')
    and id not in ('a80e5100-0000-4000-8000-000000000201','a80e5100-0000-4000-8000-000000000202','a80e5100-0000-4000-8000-000000000203')
  ) then raise exception 'D’autres réservations utilisent ces micro-ondes : nettoyage annulé.'; end if;
end;
$$;
delete from public.reservations where id in (
  'a80e5100-0000-4000-8000-000000000201','a80e5100-0000-4000-8000-000000000202','a80e5100-0000-4000-8000-000000000203'
);
delete from public.photos where id in (
  'a80e5100-0000-4000-8000-000000000001','a80e5100-0000-4000-8000-000000000002',
  'a80e5100-0000-4000-8000-000000000003','a80e5100-0000-4000-8000-000000000004'
);
delete from public.microwaves where id in (
  'a80e5100-0000-4000-8000-000000000101','a80e5100-0000-4000-8000-000000000102'
);
commit;
