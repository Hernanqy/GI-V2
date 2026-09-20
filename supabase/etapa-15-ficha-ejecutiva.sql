-- GI Cultura V2 · Etapa 15 · Ficha ejecutiva por dependencia
-- La base remota ya fue actualizada.
alter table public.areas
  add column if not exists written_agenda text null,
  add column if not exists management_summary text null,
  add column if not exists management_needs text null;