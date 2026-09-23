-- Removes only the fixture rows created by seed-photo-history.sql.
-- No profile or Auth user is ever touched.
begin;
delete from public.votes where photo_id in (
  'b70e5100-0000-4000-8000-000000000001',
  'b70e5100-0000-4000-8000-000000000002',
  'b70e5100-0000-4000-8000-000000000003'
);
delete from public.reservations where id = 'b70e5100-0000-4000-8000-000000000201';
delete from public.photos where id in (
  'b70e5100-0000-4000-8000-000000000001',
  'b70e5100-0000-4000-8000-000000000002',
  'b70e5100-0000-4000-8000-000000000003'
);
do $$
begin
  if exists (
    select 1 from public.reservations
    where microwave_id = 'b70e5100-0000-4000-8000-000000000101'
  ) then raise exception 'D’autres réservations utilisent ce micro-ondes de test : nettoyage annulé.'; end if;
end;
$$;
delete from public.microwaves where id = 'b70e5100-0000-4000-8000-000000000101';
commit;
