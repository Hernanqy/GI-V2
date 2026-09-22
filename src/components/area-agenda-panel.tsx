import {
  AreaAgendaMonths,
  type AreaAgendaItem,
} from "@/components/area-agenda-months";

import { createClient } from "@/lib/supabase/server";

import type {
  EspacioCultural,
} from "@/lib/areas-data";


type Props = {
  areaId: string;
  areaName: string;
  espacios: EspacioCultural[];
};


type EntryRow = {
  id: string;
  title: string;
  details: string | null;
  kind: string;
  status: string;
  space_id: string | null;
  due_date: string | null;
  starts_at: string | null;
  metadata: any;
};


export async function AreaAgendaPanel({
  areaId,
  areaName,
  espacios,
}: Props) {

  const supabase =
    await createClient();

  const db =
    supabase as any;


  const { data, error } =
    await db
      .from("entries")
      .select(
        `
          id,
          title,
          details,
          kind,
          status,
          space_id,
          due_date,
          starts_at,
          metadata
        `,
      )
      .eq(
        "area_id",
        areaId,
      )
      .in(
        "kind",
        [
          "evento",
          "reunion",
        ],
      )
      .neq(
        "status",
        "cancelado",
      )
      .order(
        "due_date",
        {
          ascending: true,
          nullsFirst: false,
        },
      )
      .order(
        "starts_at",
        {
          ascending: true,
          nullsFirst: false,
        },
      )
      .limit(500);


  if (error) {
    console.error(
      "Error cargando agenda:",
      error.message,
    );
  }


  const nombresEspacios =
    new Map(
      espacios.map(
        (espacio) => [
          espacio.id,
          espacio.nombre,
        ],
      ),
    );


  const entradas:
    AreaAgendaItem[] =
    ((data ?? []) as EntryRow[])
      .map(
        (entrada) => {

          const metadata =
            entrada.metadata &&
            typeof entrada.metadata ===
              "object"
              ? entrada.metadata
              : {};


          const missingFields =
            Array.isArray(
              metadata.missing_fields,
            )
              ? metadata.missing_fields.filter(
                  (
                    item: unknown,
                  ): item is string =>
                    typeof item ===
                    "string",
                )
              : [];


          const categoria =
            typeof metadata
              .agenda_category ===
              "string"
              ? metadata.agenda_category
              : (
                  entrada.kind ===
                  "reunion"
                    ? "reunion"
                    : "evento"
                );


          const sourceEndDate =
            typeof metadata
              .source_end_date ===
              "string"
              ? metadata.source_end_date
              : null;


          return {
            id:
              entrada.id,

            titulo:
              entrada.title,

            detalle:
              entrada.details ?? "",

            estado:
              entrada.status,

            categoria,

            espacioId:
              entrada.space_id,

            espacio:
              entrada.space_id
                ? (
                    nombresEspacios.get(
                      entrada.space_id,
                    ) ?? null
                  )
                : null,

            fecha:
              entrada.due_date,

            inicio:
              entrada.starts_at,

            fechaFin:
              sourceEndDate,

            faltantes:
              missingFields,
          };
        },
      );


  const espacioInicial =
    espacios.length === 1
      ? espacios[0].id
      : "";


  const hrefCarga =
    `/registrar?tipo=evento&area=${encodeURIComponent(
      areaId,
    )}` +
    (
      espacioInicial
        ? `&space=${encodeURIComponent(
            espacioInicial,
          )}`
        : ""
    );


  return (
    <AreaAgendaMonths
      areaName={areaName}
      entradas={entradas}
      hrefCarga={hrefCarga}
      espacios={
        espacios.map(
          (espacio) => ({
            id:
              espacio.id,

            nombre:
              espacio.nombre,
          }),
        )
      }
    />
  );
}