-- GI Cultura V2 · Etapa 5
-- Ejecutar DESPUÉS de crear en Authentication > Users el usuario:
-- correo interno: hernan@usuarios.gi-cultura.app

alter table public.profiles add column if not exists username text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_format_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{2,31}$');
  end if;
end $$;

create unique index if not exists profiles_username_unique_idx
on public.profiles (username)
where username is not null;

do $$
declare
  usuario_id uuid;
begin
  select id into usuario_id
  from auth.users
  where lower(email) = 'hernan@usuarios.gi-cultura.app'
  limit 1;

  if usuario_id is null then
    raise exception 'Primero creá el usuario hernan@usuarios.gi-cultura.app en Authentication > Users';
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'coordinacion')
  where id = usuario_id;

  insert into public.profiles (id, username, display_name, role, active)
  values (usuario_id, 'hernan', 'Hernán Gustavo Quiroga', 'coordinacion', true)
  on conflict (id) do update
  set username = excluded.username,
      display_name = excluded.display_name,
      role = excluded.role,
      area_id = null,
      active = true;
end $$;

alter table public.profiles alter column username set not null;
