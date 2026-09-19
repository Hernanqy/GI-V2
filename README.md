# GI Cultura 2

Plataforma institucional de la Subsecretaría de Cultura de Olavarría.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Supabase

1. Crear un proyecto nuevo.
2. Ejecutar `supabase/schema.sql` en el SQL Editor.
3. Copiar `.env.example` como `.env.local`.
4. Completar la URL y la clave publicable del proyecto.

Si el proyecto ya está funcionando por etapas, ejecutar también los archivos SQL de cada etapa en orden. Las etapas actuales incorporan agenda y eventos mediante `supabase/etapa-8-agenda-eventos.sql`, y Bitácora mediante `supabase/etapa-9-bitacora-registros.sql`.

No usar una clave secreta ni `service_role` en variables `NEXT_PUBLIC_*`.
