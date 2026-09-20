-- ETAPA 12 · Fichas institucionales y operativas de espacios

alter table public.spaces
  add column if not exists responsible_name text,
  add column if not exists opening_hours text,
  add column if not exists public_contact text,
  add column if not exists operational_status text default 'activo',
  add column if not exists management_notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'spaces_operational_status_check'
  ) then
    alter table public.spaces
      add constraint spaces_operational_status_check
      check (
        operational_status in (
          'activo',
          'actividad_parcial',
          'cerrado_temporalmente',
          'sin_referente',
          'a_confirmar'
        )
      );
  end if;
end $$;