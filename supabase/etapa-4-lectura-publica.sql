-- GI Cultura V2 · Etapa 4
-- Permite que la app lea únicamente las áreas y los espacios activos.
-- Perfiles, solicitudes y registros continúan protegidos.

grant usage on schema public to anon;
grant select on public.areas, public.spaces to anon;

drop policy if exists "areas_read_public_reference" on public.areas;
create policy "areas_read_public_reference"
on public.areas
for select
to anon
using (active = true);

drop policy if exists "spaces_read_public_reference" on public.spaces;
create policy "spaces_read_public_reference"
on public.spaces
for select
to anon
using (active = true);
