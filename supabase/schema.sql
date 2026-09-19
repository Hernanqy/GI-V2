-- GI Cultura V2 · esquema inicial
-- Ejecutar completo desde Supabase > SQL Editor.

create extension if not exists pgcrypto;
create schema if not exists private;

do $$ begin
  create type public.app_role as enum ('coordinacion', 'responsable_area');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.entry_kind as enum ('evento', 'solicitud', 'reunion', 'nota', 'actualizacion');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.entry_status as enum ('borrador', 'pendiente', 'confirmado', 'completado', 'cancelado');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.priority_level as enum ('normal', 'alta', 'compromiso_prioritario');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.visibility_level as enum ('general', 'area', 'coordinacion');
exception when duplicate_object then null;
end $$;

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = lower(slug)),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas(id) on delete restrict,
  name text not null,
  space_type text,
  locality text,
  address text,
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  location_validated boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (area_id, name)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  display_name text not null,
  role public.app_role not null default 'responsable_area',
  area_id uuid references public.areas(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_area_check check (role = 'coordinacion' or area_id is not null)
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  kind public.entry_kind not null,
  title text not null check (char_length(trim(title)) >= 3),
  details text,
  area_id uuid not null references public.areas(id) on delete restrict,
  space_id uuid references public.spaces(id) on delete set null,
  status public.entry_status not null default 'pendiente',
  priority public.priority_level not null default 'normal',
  visibility public.visibility_level not null default 'area',
  starts_at timestamptz,
  ends_at timestamptz,
  due_date date,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_date_order check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create index if not exists spaces_area_id_idx on public.spaces(area_id);
create index if not exists spaces_locality_idx on public.spaces(locality) where locality is not null;
create index if not exists profiles_area_id_idx on public.profiles(area_id) where area_id is not null;
create index if not exists entries_area_status_idx on public.entries(area_id, status);
create index if not exists entries_kind_starts_at_idx on public.entries(kind, starts_at) where starts_at is not null;
create index if not exists entries_due_date_idx on public.entries(due_date) where due_date is not null;
create index if not exists entries_created_by_idx on public.entries(created_by) where created_by is not null;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

drop trigger if exists areas_set_updated_at on public.areas;
create trigger areas_set_updated_at before update on public.areas
for each row execute function private.set_updated_at();

drop trigger if exists spaces_set_updated_at on public.spaces;
create trigger spaces_set_updated_at before update on public.spaces
for each row execute function private.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at before update on public.entries
for each row execute function private.set_updated_at();

alter table public.areas enable row level security;
alter table public.spaces enable row level security;
alter table public.profiles enable row level security;
alter table public.entries enable row level security;

revoke all on public.areas, public.spaces, public.profiles, public.entries from anon;
grant usage on schema public to anon;
grant select on public.areas, public.spaces to anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.areas, public.spaces, public.profiles, public.entries to authenticated;

drop policy if exists "areas_read_public_reference" on public.areas;
create policy "areas_read_public_reference" on public.areas for select to anon using (active = true);

drop policy if exists "spaces_read_public_reference" on public.spaces;
create policy "spaces_read_public_reference" on public.spaces for select to anon using (active = true);

drop policy if exists "areas_read_authenticated" on public.areas;
create policy "areas_read_authenticated" on public.areas for select to authenticated using (true);
drop policy if exists "areas_write_coordinacion" on public.areas;
create policy "areas_write_coordinacion" on public.areas for all to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion')
with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion');

drop policy if exists "spaces_read_authenticated" on public.spaces;
create policy "spaces_read_authenticated" on public.spaces for select to authenticated using (true);
drop policy if exists "spaces_write_coordinacion" on public.spaces;
create policy "spaces_write_coordinacion" on public.spaces for all to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion')
with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion');

drop policy if exists "profiles_read_authenticated" on public.profiles;
create policy "profiles_read_authenticated" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles_write_coordinacion" on public.profiles;
create policy "profiles_write_coordinacion" on public.profiles for insert to authenticated
with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion');
drop policy if exists "profiles_update_coordinacion" on public.profiles;
create policy "profiles_update_coordinacion" on public.profiles for update to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion')
with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion');
drop policy if exists "profiles_delete_coordinacion" on public.profiles;
create policy "profiles_delete_coordinacion" on public.profiles for delete to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion');

drop policy if exists "entries_read_by_scope" on public.entries;
create policy "entries_read_by_scope" on public.entries for select to authenticated
using (
  visibility = 'general'
  or created_by = (select auth.uid())
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion'
  or area_id::text = coalesce((select auth.jwt()) -> 'app_metadata' ->> 'area_id', '')
);
drop policy if exists "entries_insert_by_scope" on public.entries;
create policy "entries_insert_by_scope" on public.entries for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion'
    or area_id::text = coalesce((select auth.jwt()) -> 'app_metadata' ->> 'area_id', '')
  )
);
drop policy if exists "entries_update_by_scope" on public.entries;
create policy "entries_update_by_scope" on public.entries for update to authenticated
using (
  created_by = (select auth.uid())
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion'
  or area_id::text = coalesce((select auth.jwt()) -> 'app_metadata' ->> 'area_id', '')
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion'
  or area_id::text = coalesce((select auth.jwt()) -> 'app_metadata' ->> 'area_id', '')
);
drop policy if exists "entries_delete_owner_or_coordinacion" on public.entries;
create policy "entries_delete_owner_or_coordinacion" on public.entries for delete to authenticated
using (created_by = (select auth.uid()) or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion');

insert into public.areas (slug, name, description) values
  ('patrimonio-cultural', 'Patrimonio Cultural', 'Museos, archivo, IIAO, monumentos y bienes patrimoniales.'),
  ('polo-la-maxima', 'Polo La Máxima', 'Educación ambiental, ciencia, tecnología y biodiversidad.'),
  ('centros-culturales', 'Centros culturales', 'Programación, muestras, talleres y gestión de espacios.'),
  ('educacion-artistica', 'Educación artística', 'Escuelas municipales, sedes, talleres y propuestas educativas.'),
  ('teatro-municipal', 'Teatro Municipal', 'Programación, sala, producción, equipo y necesidades técnicas.'),
  ('eventos', 'Eventos', 'Producción transversal, fiestas populares, logística y articulaciones.')
on conflict (slug) do update set name = excluded.name, description = excluded.description, active = true;

insert into public.spaces (area_id, name)
select a.id, s.name
from public.areas a
join (values
  ('patrimonio-cultural', 'Museo Dámaso Arce'),
  ('patrimonio-cultural', 'Museo Hermanos Emiliozzi'),
  ('patrimonio-cultural', 'Archivo Histórico Municipal'),
  ('patrimonio-cultural', 'IIAO'),
  ('patrimonio-cultural', 'Museo Estación Sierras Bayas'),
  ('patrimonio-cultural', 'Museo Hogar Loma Negra'),
  ('patrimonio-cultural', 'Museo Alemanes del Volga Ariel Chierico'),
  ('patrimonio-cultural', 'Museo Municipal de Espigas'),
  ('patrimonio-cultural', 'Museo Municipal Mapis'),
  ('patrimonio-cultural', 'Museo de la Piedra Emma Occhi'),
  ('patrimonio-cultural', 'Museo Miguel Stoessel Müller'),
  ('patrimonio-cultural', 'Museo Municipal de Hinojo'),
  ('polo-la-maxima', 'Bioparque La Máxima'),
  ('polo-la-maxima', 'Museo de las Ciencias'),
  ('polo-la-maxima', 'CIIT'),
  ('polo-la-maxima', 'Reserva Natural Municipal Urbana'),
  ('polo-la-maxima', 'GOCO'),
  ('centros-culturales', 'Centro Cultural San José'),
  ('centros-culturales', 'Casa del Bicentenario'),
  ('centros-culturales', 'Centro Cultural Hinojo'),
  ('centros-culturales', 'Centro Cultural Sierras Bayas'),
  ('teatro-municipal', 'Teatro Municipal')
) as s(area_slug, name) on s.area_slug = a.slug
on conflict (area_id, name) do update set active = true;

-- Los domicilios, localidades y coordenadas quedan vacíos hasta su validación institucional.
