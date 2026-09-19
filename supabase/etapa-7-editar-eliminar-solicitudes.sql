-- GI Cultura V2 · Etapa 7
-- Permite editar y eliminar solicitudes según alcance y rol.

alter table public.entries enable row level security;
grant select, update, delete on table public.entries to authenticated;

drop policy if exists "entries_delete_owner_or_coordinacion" on public.entries;
create policy "entries_delete_owner_or_coordinacion"
on public.entries for delete
to authenticated
using (
  created_by = (select auth.uid())
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion'
);
