begin;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('profile-avatars', 'profile-avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true, file_size_limit=2097152, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

-- Public display of avatars; writes and object listing remain owner-only.
drop policy if exists personal_avatar_read on storage.objects;
create policy personal_avatar_read on storage.objects for select to authenticated
using(bucket_id='profile-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists personal_avatar_insert on storage.objects;
create policy personal_avatar_insert on storage.objects for insert to authenticated
with check(bucket_id='profile-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists personal_avatar_delete on storage.objects;
create policy personal_avatar_delete on storage.objects for delete to authenticated
using(bucket_id='profile-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Guard against older permissive policies on other buckets.
drop policy if exists personal_avatar_insert_guard on storage.objects;
create policy personal_avatar_insert_guard on storage.objects as restrictive for insert to public
with check(bucket_id<>'profile-avatars' or (auth.uid() is not null and (storage.foldername(name))[1]=(select auth.uid())::text));
drop policy if exists personal_avatar_update_guard on storage.objects;
create policy personal_avatar_update_guard on storage.objects as restrictive for update to public
using(bucket_id<>'profile-avatars') with check(bucket_id<>'profile-avatars');
drop policy if exists personal_avatar_delete_guard on storage.objects;
create policy personal_avatar_delete_guard on storage.objects as restrictive for delete to public
using(bucket_id<>'profile-avatars' or (auth.uid() is not null and (storage.foldername(name))[1]=(select auth.uid())::text));
drop policy if exists personal_avatar_select_guard on storage.objects;
create policy personal_avatar_select_guard on storage.objects as restrictive for select to public
using(bucket_id<>'profile-avatars' or (auth.uid() is not null and (storage.foldername(name))[1]=(select auth.uid())::text));

create or replace function public.get_my_personal_profile()
returns table(pseudo text, avatar_url text)
language sql stable security definer set search_path = '' as $$
  select p.pseudo, p.avatar_url from public.profiles p where p.id=(select auth.uid());
$$;

create or replace function public.update_my_personal_profile(p_pseudo text, p_avatar_url text default null, p_change_avatar boolean default false)
returns table(pseudo text, avatar_url text)
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  object_path text;
begin
  if caller is null then raise exception 'Connexion requise.' using errcode='42501'; end if;
  if p_pseudo is null or length(btrim(p_pseudo)) not between 2 and 32 or p_pseudo ~ '[[:cntrl:]]' then
    raise exception 'Pseudo invalide.' using errcode='22023';
  end if;
  if p_change_avatar and p_avatar_url is not null then
    if p_avatar_url !~ ('^https://[^/]+/storage/v1/object/public/profile-avatars/' || caller::text || '/[0-9a-f-]+\.(jpg|png|webp)$') then
      raise exception 'Photo invalide.' using errcode='22023';
    end if;
    object_path := split_part(p_avatar_url, '/storage/v1/object/public/profile-avatars/', 2);
    if not exists(select 1 from storage.objects o where o.bucket_id='profile-avatars' and o.name=object_path) then
      raise exception 'Photo introuvable.' using errcode='22023';
    end if;
  end if;
  return query update public.profiles p
    set pseudo=btrim(p_pseudo), avatar_url=case when p_change_avatar then p_avatar_url else p.avatar_url end
    where p.id=caller returning p.pseudo,p.avatar_url;
  if not found then raise exception 'Profil introuvable.' using errcode='P0002'; end if;
end;
$$;
revoke all on function public.get_my_personal_profile() from public, anon, authenticated;
revoke all on function public.update_my_personal_profile(text,text,boolean) from public, anon, authenticated;
grant execute on function public.get_my_personal_profile() to authenticated;
grant execute on function public.update_my_personal_profile(text,text,boolean) to authenticated;
commit;
