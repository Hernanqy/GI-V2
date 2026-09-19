-- GI Cultura V2 · Etapa 6
-- Habilita la carga y el seguimiento de registros para usuarios autenticados.

alter table public.entries enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.entries to authenticated;

drop policy if exists "entries_read_by_scope" on public.entries;
create policy "entries_read_by_scope"
on public.entries for select
to authenticated
using (
  visibility = 'general'
  or created_by = (select auth.uid())
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion'
  or area_id::text = coalesce((select auth.jwt()) -> 'app_metadata' ->> 'area_id', '')
);

drop policy if exists "entries_insert_by_scope" on public.entries;
create policy "entries_insert_by_scope"
on public.entries for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion'
    or area_id::text = coalesce((select auth.jwt()) -> 'app_metadata' ->> 'area_id', '')
  )
);

drop policy if exists "entries_update_by_scope" on public.entries;
create policy "entries_update_by_scope"
on public.entries for update
to authenticated
using (
  created_by = (select auth.uid())
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion'
  or area_id::text = coalesce((select auth.jwt()) -> 'app_metadata' ->> 'area_id', '')
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion'
  or area_id::text = coalesce((select auth.jwt()) -> 'app_metadata' ->> 'area_id', '')
);
