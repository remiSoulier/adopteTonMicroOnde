begin;

alter table public.profiles add column if not exists role smallint not null default 1;
alter table public.profiles alter column role set default 1;
alter table public.profiles alter column role set not null;
alter table public.profiles drop constraint if exists profiles_role_range;
alter table public.profiles add constraint profiles_role_range check (role in (1, 2, 3));
alter table public.profiles enable row level security;

-- Guards remain effective even if older RLS policies allow profile updates.
-- Invoker security is intentional: only trusted database roles / controlled
-- security-definer functions can change the role or identity of a profile.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.role := 1;
    return new;
  end if;
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'DELETE' then
      if old.role = 3 then
        raise exception 'Un superadmin ne peut pas être supprimé depuis le client.' using errcode = '42501';
      end if;
      return old;
    end if;
    if new.role is distinct from old.role or new.id is distinct from old.id then
      raise exception 'Utiliser la gestion des droits pour changer un rôle.' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role before insert or update or delete on public.profiles
for each row execute function public.guard_profile_role();
revoke all on function public.guard_profile_role() from public, anon, authenticated;

create or replace function public.get_my_role()
returns smallint language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.list_user_roles(p_offset integer default 0)
returns table(id uuid, pseudo text, role smallint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.get_my_role(), 0) < 2 then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;
  if p_offset is null or p_offset < 0 or p_offset > 1000000 then
    raise exception 'Page invalide.' using errcode = '22023';
  end if;
  return query select p.id, p.pseudo, p.role from public.profiles p
    order by p.pseudo, p.id limit 51 offset p_offset;
end;
$$;

create or replace function public.set_user_role(p_user_id uuid, p_role smallint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Serialize role changes; recheck the caller after acquiring the lock.
  perform pg_catalog.pg_advisory_xact_lock(824731095);
  if coalesce(public.get_my_role(), 0) <> 3 then
    raise exception 'Seul un superadmin peut modifier les rôles.' using errcode = '42501';
  end if;
  if p_user_id is null or p_role is null or p_role not in (1, 2, 3) then
    raise exception 'Rôle ou utilisateur invalide.' using errcode = '22023';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Tu ne peux pas modifier ton propre rôle.' using errcode = '42501';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  if not found then
    raise exception 'Profil introuvable.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.get_my_role() from public, anon, authenticated;
revoke all on function public.list_user_roles(integer) from public, anon, authenticated;
revoke all on function public.set_user_role(uuid, smallint) from public, anon, authenticated;
grant execute on function public.get_my_role() to authenticated;
grant execute on function public.list_user_roles(integer) to authenticated;
grant execute on function public.set_user_role(uuid, smallint) to authenticated;
commit;
