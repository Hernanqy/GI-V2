-- Etapa 8: agenda y eventos reales. Es seguro ejecutarlo más de una vez.
alter table public.entries enable row level security;
grant select, insert, update, delete on table public.entries to authenticated;
create index if not exists entries_agenda_active_idx
  on public.entries (starts_at, status)
  where kind in ('evento', 'reunion') and starts_at is not null;
