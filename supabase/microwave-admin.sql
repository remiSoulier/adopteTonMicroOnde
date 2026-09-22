begin;

-- Run after roles.sql. Existing public read policies are preserved.
alter table public.microwaves add column if not exists is_active boolean not null default true;
alter table public.microwaves add column if not exists deleted_at timestamptz;
-- Soft deletion preserves reservation foreign keys and historical winner names.
alter table public.microwaves enable row level security;
-- Mutations go through the checked functions, even with legacy permissive policies.
drop policy if exists microwaves_no_direct_insert on public.microwaves;
create policy microwaves_no_direct_insert on public.microwaves as restrictive for insert to anon, authenticated with check(false);
drop policy if exists microwaves_no_direct_update on public.microwaves;
create policy microwaves_no_direct_update on public.microwaves as restrictive for update to anon, authenticated using(false) with check(false);
drop policy if exists microwaves_no_direct_delete on public.microwaves;
create policy microwaves_no_direct_delete on public.microwaves as restrictive for delete to anon, authenticated using(false);

-- The return type changed since the initial migration.
drop function if exists public.admin_list_microwaves(integer);
create function public.admin_list_microwaves(p_offset integer default 0)
returns table(id uuid, nom text, is_active boolean, can_delete boolean)
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.get_my_role(),0) not in (2,3) then
    raise exception 'Accès réservé aux administrateurs.' using errcode='42501';
  end if;
  if p_offset is null or p_offset < 0 or p_offset > 1000000 then raise exception 'Page invalide.' using errcode='22023'; end if;
  return query select m.id, m.nom::text, m.is_active,
    not exists(select 1 from public.reservations r where r.microwave_id=m.id
      and (r.date is null or r.date >= (now() at time zone 'Europe/Paris')::date - 2))
    from public.microwaves m where m.deleted_at is null
    order by m.nom,m.id limit 51 offset p_offset;
end;
$$;

create or replace function public.admin_save_microwave(p_id uuid, p_nom text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.get_my_role(),0) not in (2,3) then
    raise exception 'Accès réservé aux administrateurs.' using errcode='42501';
  end if;
  if p_nom is null or char_length(btrim(p_nom)) not between 1 and 100 then
    raise exception 'Le nom doit contenir entre 1 et 100 caractères.' using errcode='22023';
  end if;
  if p_id is null then
    insert into public.microwaves(id,nom) values(gen_random_uuid(),btrim(p_nom));
  else
    update public.microwaves set nom=btrim(p_nom) where id=p_id and deleted_at is null;
    if not found then raise exception 'Micro-ondes introuvable.' using errcode='P0002'; end if;
  end if;
end;
$$;

create or replace function public.admin_delete_microwave(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.get_my_role(),0) not in (2,3) then
    raise exception 'Accès réservé aux administrateurs.' using errcode='42501';
  end if;
  -- Prevent a concurrent attribution between the reservation check and deletion.
  lock table public.reservations in share row exclusive mode;
  if exists(select 1 from public.reservations where microwave_id=p_id
      and (date is null or date >= (now() at time zone 'Europe/Paris')::date - 2)) then
    raise exception 'Toutes les réservations doivent dater de plus de deux jours.' using errcode='23503';
  end if;
  update public.microwaves set deleted_at=now(), is_active=false
    where id=p_id and deleted_at is null;
  if not found then raise exception 'Micro-ondes introuvable.' using errcode='P0002'; end if;
end;
$$;
create or replace function public.admin_set_microwave_active(p_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.get_my_role(),0) not in (2,3) then
    raise exception 'Accès réservé aux administrateurs.' using errcode='42501';
  end if;
  if p_active is null then raise exception 'Statut invalide.' using errcode='22023'; end if;
  update public.microwaves set is_active=p_active where id=p_id and deleted_at is null;
  if not found then raise exception 'Micro-ondes introuvable.' using errcode='P0002'; end if;
end;
$$;

-- Final safeguard for every attribution, including security-definer RPCs.
-- The draw query must also filter is_active=true AND deleted_at IS NULL
-- so it skips unavailable devices rather than failing on this guard.
create or replace function public.guard_microwave_reservation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  available boolean;
begin
  if tg_op = 'UPDATE' then
    if new.microwave_id is not distinct from old.microwave_id then return new; end if;
  end if;
  select m.is_active and m.deleted_at is null into available
    from public.microwaves m where m.id=new.microwave_id for share;
  if available is distinct from true then
    raise exception 'Ce micro-ondes est désactivé, supprimé ou introuvable.' using errcode='23514';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_microwave_reservation on public.reservations;
create trigger guard_microwave_reservation before insert or update of microwave_id on public.reservations
for each row execute function public.guard_microwave_reservation();
revoke all on function public.guard_microwave_reservation() from public,anon,authenticated;
revoke all on function public.admin_set_microwave_active(uuid,boolean) from public,anon,authenticated;
grant execute on function public.admin_set_microwave_active(uuid,boolean) to authenticated;

revoke all on function public.admin_list_microwaves(integer) from public,anon,authenticated;
revoke all on function public.admin_save_microwave(uuid,text) from public,anon,authenticated;
revoke all on function public.admin_delete_microwave(uuid) from public,anon,authenticated;
grant execute on function public.admin_list_microwaves(integer) to authenticated;
grant execute on function public.admin_save_microwave(uuid,text) to authenticated;
grant execute on function public.admin_delete_microwave(uuid) to authenticated;
commit;
