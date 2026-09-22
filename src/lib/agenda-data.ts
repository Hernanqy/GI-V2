import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type EntryStatus =
  Database["public"]["Enums"]["entry_status"];

type EntryKind =
  Database["public"]["Enums"]["entry_kind"];

type Priority =
  Database["public"]["Enums"]["priority_level"];


export type EntradaAgenda = {
  id: string;
  titulo: string;
  detalle: string;
  areaId: string;
  area: string;
  espacioId: string | null;
  espacio: string | null;
  tipo: Extract<
    EntryKind,
    "evento" | "reunion"
  >;
  categoria: string;
  estado: EntryStatus;
  prioridad: Priority;
  inicio: string;
  tieneHora: boolean;
  fin: string | null;
  completa: boolean;
  faltantes: string[];
};


function categoriaEntrada(
  kind: string,
  metadata: any,
) {

  if (
    metadata &&
    typeof metadata.agenda_category === "string" &&
    metadata.agenda_category
  ) {
    return metadata.agenda_category;
  }

  return kind === "reunion"
    ? "reunion"
    : "evento";
}


export async function obtenerEntradasAgenda():
Promise<EntradaAgenda[]> {

  const supabase =
    await createClient();


  const [
    entradasResult,
    areasResult,
    espaciosResult,
  ] =
    await Promise.all([

      supabase
        .from("entries")
        .select(
          "id, title, details, area_id, space_id, kind, status, priority, starts_at, ends_at, due_date, metadata",
        )
        .in(
          "kind",
          ["evento", "reunion"],
        )
        .neq(
          "status",
          "cancelado",
        ),

      supabase
        .from("areas")
        .select("id, name"),

      supabase
        .from("spaces")
        .select("id, name"),

    ]);


  if (
    entradasResult.error
  ) {
    throw new Error(
      `No se pudo cargar la agenda: ${entradasResult.error.message}`,
    );
  }


  const areas =
    new Map(
      (areasResult.data ?? [])
        .map(
          (area) => [
            area.id,
            area.name,
          ],
        ),
    );


  const espacios =
    new Map(
      (espaciosResult.data ?? [])
        .map(
          (espacio) => [
            espacio.id,
            espacio.name,
          ],
        ),
    );


  return (
    entradasResult.data ?? []
  )
    .flatMap(
      (entrada: any) => {

        const tieneHora =
          Boolean(
            entrada.starts_at,
          );


        const inicio =
          entrada.starts_at ??
          (
            entrada.due_date
              ? `${entrada.due_date}T12:00:00-03:00`
              : null
          );


        if (
          !inicio ||
          (
            entrada.kind !== "evento" &&
            entrada.kind !== "reunion"
          )
        ) {
          return [];
        }


        const faltantes =
          new Set<string>();


        const metadataMissing =
          entrada.metadata
            ?.missing_fields;


        if (
          Array.isArray(
            metadataMissing,
          )
        ) {
          metadataMissing.forEach(
            (item: unknown) => {
              if (
                typeof item === "string"
              ) {
                faltantes.add(item);
              }
            },
          );
        }


        if (!tieneHora) {
          faltantes.add("hora");
        }


        if (
          !entrada.details?.trim()
        ) {
          faltantes.add("detalle");
        }


        return [{
          id:
            entrada.id,

          titulo:
            entrada.title,

          detalle:
            entrada.details ?? "",

          areaId:
            entrada.area_id,

          area:
            areas.get(
              entrada.area_id,
            ) ??
            "Dependencia sin identificar",

          espacioId:
            entrada.space_id,

          espacio:
            entrada.space_id
              ? (
                  espacios.get(
                    entrada.space_id,
                  ) ??
                  "Espacio sin identificar"
                )
              : null,

          tipo:
            entrada.kind,

          categoria:
            categoriaEntrada(
              entrada.kind,
              entrada.metadata,
            ),

          estado:
            entrada.status,

          prioridad:
            entrada.priority,

          inicio,

          tieneHora,

          fin:
            entrada.ends_at,

          completa:
            faltantes.size === 0,

          faltantes:
            [...faltantes],
        }];
      },
    )
    .sort(
      (a, b) =>
        new Date(
          a.inicio,
        ).getTime() -
        new Date(
          b.inicio,
        ).getTime(),
    );
}


export async function obtenerProximasEntradas(
  limite = 4,
) {

  const ahora =
    Date.now();

  const entradas =
    await obtenerEntradasAgenda();

  return entradas
    .filter(
      (entrada) =>
        entrada.estado !==
          "completado" &&
        new Date(
          entrada.inicio,
        ).getTime() >=
          ahora,
    )
    .slice(
      0,
      limite,
    );
}