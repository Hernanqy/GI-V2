-- GI Cultura V2 - Etapa 9. Es seguro ejecutarlo mas de una vez.
alter table public.entries enable row level security;
grant select, insert, update, delete on table public.entries to authenticated;
create index if not exists entries_bitacora_idx
  on public.entries (kind, status, created_at desc)
  where kind in ('nota', 'actualizacion', 'evento', 'reunion');
