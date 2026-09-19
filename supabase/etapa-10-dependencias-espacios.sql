-- GI Cultura V2 · Etapa 10
-- Dependencias y espacios editables.
-- Es seguro ejecutarlo más de una vez.

alter table public.areas enable row level security;
alter table public.spaces enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.areas to authenticated;
grant select, insert, update, delete on table public.spaces to authenticated;

drop policy if exists "areas_read_authenticated" on public.areas;
create policy "areas_read_authenticated"
on public.areas for select
to authenticated
using (true);

drop policy if exists "areas_write_coordinacion" on public.areas;
create policy "areas_write_coordinacion"
on public.areas for all
to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion')
with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion');

drop policy if exists "spaces_read_authenticated" on public.spaces;
create policy "spaces_read_authenticated"
on public.spaces for select
to authenticated
using (true);

drop policy if exists "spaces_write_coordinacion" on public.spaces;
create policy "spaces_write_coordinacion"
on public.spaces for all
to authenticated
using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion')
with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinacion');

-- Preserva la relación histórica entre registros y espacios.
-- Un espacio con registros asociados no puede eliminarse accidentalmente.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'entries_space_id_fkey'
      and conrelid = 'public.entries'::regclass
  ) then
    alter table public.entries drop constraint entries_space_id_fkey;
  end if;

  alter table public.entries
    add constraint entries_space_id_fkey
    foreign key (space_id)
    references public.spaces(id)
    on delete restrict;
exception
  when duplicate_object then null;
end $$;

create index if not exists spaces_area_active_idx
  on public.spaces (area_id, active, name);
