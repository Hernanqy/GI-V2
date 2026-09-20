-- GI Cultura V2 Â· Etapa 13 Â· Personal por dependencia y espacio
-- Este archivo documenta la estructura aplicada en Supabase.

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas(id) on delete restrict,
  space_id uuid null references public.spaces(id) on delete restrict,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  employee_number text null,
  role_title text null,
  tasks text null,
  employment_type text null,
  weekly_hours text null,
  status text not null default 'activo'
    check (status in ('activo','licencia','baja','a_confirmar')),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_area_id_idx on public.staff(area_id);
create index if not exists staff_space_id_idx on public.staff(space_id);
create index if not exists staff_employee_number_idx on public.staff(employee_number);
create index if not exists staff_full_name_lower_idx on public.staff((lower(full_name)));

alter table public.staff enable row level security;

revoke all on table public.staff from anon;
grant select, insert, update, delete on table public.staff to authenticated;
grant select, insert, update, delete on table public.staff to service_role;

drop policy if exists staff_read_by_scope on public.staff;
create policy staff_read_by_scope
on public.staff for select to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'coordinacion'
  or area_id::text = coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'area_id'), '')
);

drop policy if exists staff_insert_by_scope on public.staff;
create policy staff_insert_by_scope
on public.staff for insert to authenticated
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'coordinacion'
  or area_id::text = coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'area_id'), '')
);

drop policy if exists staff_update_by_scope on public.staff;
create policy staff_update_by_scope
on public.staff for update to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'coordinacion'
  or area_id::text = coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'area_id'), '')
)
with check (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'coordinacion'
  or area_id::text = coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'area_id'), '')
);

drop policy if exists staff_delete_by_scope on public.staff;
create policy staff_delete_by_scope
on public.staff for delete to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'coordinacion'
  or area_id::text = coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'area_id'), '')
);