import Link from "next/link";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  TriangleAlert,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { EspacioCultural } from "@/lib/areas-data";


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


const estadoLabel: Record<string, string> = {
  borrador: "Borrador",
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
};


const categoriaLabel: Record<string, string> = {
  evento: "Evento",
  taller: "Taller",
  propuesta_educativa: "Propuesta educativa",
  reunion: "Reunión",
  otro: "Actividad",
};


function fechaLocal(valor: string) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone:
        "America/Argentina/Buenos_Aires",
    },
  ).format(new Date(valor));
}


function fechaVisual(
  dueDate: string | null,
  startsAt: string | null,
) {

  const base =
    dueDate ||
    (
      startsAt
        ? fechaLocal(startsAt)
        : null
    );

  if (!base) {
    return {
      dia: "--",
      mes: "SIN FECHA",
    };
  }

  const [year, month, day] =
    base.split("-").map(Number);

  const fecha =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  return {
    dia:
      String(day).padStart(
        2,
        "0",
      ),

    mes:
      new Intl.DateTimeFormat(
        "es-AR",
        {
          month: "short",
          timeZone: "UTC",
        },
      )
        .format(fecha)
        .replace(".", "")
        .toUpperCase(),
  };
}


function horaVisual(
  startsAt: string | null,
) {

  if (!startsAt) {
    return "Horario pendiente";
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone:
        "America/Argentina/Buenos_Aires",
    },
  ).format(
    new Date(startsAt),
  );
}


function categoria(
  entrada: EntryRow,
) {

  const valor =
    entrada.metadata
      ?.agenda_category;

  if (
    typeof valor === "string" &&
    valor
  ) {
    return valor;
  }

  return entrada.kind === "reunion"
    ? "reunion"
    : "evento";
}


function faltantes(
  entrada: EntryRow,
  cantidadEspacios: number,
) {

  const lista =
    new Set<string>();

  const guardados =
    entrada.metadata
      ?.missing_fields;

  if (
    Array.isArray(guardados)
  ) {
    guardados.forEach(
      (item) => {
        if (
          typeof item === "string"
        ) {
          lista.add(item);
        }
      },
    );
  }

  if (!entrada.starts_at) {
    lista.add("hora");
  }

  if (
    !entrada.details?.trim()
  ) {
    lista.add("detalle");
  }

  if (
    cantidadEspacios > 1 &&
    !entrada.space_id
  ) {
    lista.add("espacio");
  }

  return [...lista];
}


export async function AreaAgendaPanel({
  areaId,
  areaName,
  espacios,
}: Props) {

  const supabase =
    await createClient();

  const db =
    supabase as any;

  const { data } =
    await db
      .from("entries")
      .select(
        "id, title, details, kind, status, space_id, due_date, starts_at, metadata",
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
        },
      )
      .order(
        "starts_at",
        {
          ascending: true,
          nullsFirst: false,
        },
      )
      .limit(120);


  const hoy =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone:
          "America/Argentina/Buenos_Aires",
      },
    ).format(new Date());


  const entradas:
    EntryRow[] =
    (data ?? [])
      .filter(
        (item: EntryRow) => {

          const fecha =
            item.due_date ||
            (
              item.starts_at
                ? fechaLocal(
                    item.starts_at,
                  )
                : ""
            );

          return (
            !fecha ||
            fecha >= hoy
          );
        },
      )
      .slice(0, 18);


  const espaciosMap =
    new Map(
      espacios.map(
        (item) => [
          item.id,
          item.nombre,
        ],
      ),
    );


  const espacioInicial =
    espacios.length === 1
      ? espacios[0].id
      : "";


  const hrefCarga =
    `/registrar?tipo=evento&area=${encodeURIComponent(areaId)}` +
    (
      espacioInicial
        ? `&space=${encodeURIComponent(espacioInicial)}`
        : ""
    );


  return (
    <section className="area-agenda-section">

      <div className="area-agenda-heading">

        <div>
          <span className="eyebrow">
            Agenda
          </span>

          <h2>
            Próximas actividades
          </h2>

          <p>
            Eventos, talleres y propuestas programadas en {areaName}.
          </p>
        </div>


        <Link
          href={hrefCarga}
          className="button primary area-agenda-add"
        >
          <Plus size={17} />

          Cargar actividad
        </Link>

      </div>


      {
        entradas.length > 0
          ? (

            <div className="area-agenda-grid">

              {
                entradas.map(
                  (entrada) => {

                    const fecha =
                      fechaVisual(
                        entrada.due_date,
                        entrada.starts_at,
                      );

                    const pendientes =
                      faltantes(
                        entrada,
                        espacios.length,
                      );

                    const cat =
                      categoria(
                        entrada,
                      );

                    const espacio =
                      entrada.space_id
                        ? espaciosMap.get(
                            entrada.space_id,
                          )
                        : null;


                    return (
                      <article
                        className={`area-agenda-card agenda-cat-${cat}`}
                        key={entrada.id}
                      >

                        <div className="area-agenda-card-top">

                          <div className="area-agenda-date">
                            <strong>
                              {fecha.dia}
                            </strong>

                            <span>
                              {fecha.mes}
                            </span>
                          </div>


                          <div className="area-agenda-badges">

                            <span className="agenda-type-chip">
                              {
                                categoriaLabel[cat] ||
                                "Actividad"
                              }
                            </span>

                            {
                              pendientes.length === 0
                                ? (
                                  <span className="agenda-ready-chip">
                                    <CheckCircle2 size={12} />
                                    Lista
                                  </span>
                                )
                                : (
                                  <span className="agenda-warning-chip">
                                    <TriangleAlert size={12} />
                                    Faltan datos
                                  </span>
                                )
                            }

                          </div>

                        </div>


                        <div className="area-agenda-card-body">

                          <span className="agenda-entry-status">
                            {
                              estadoLabel[
                                entrada.status
                              ] ||
                              entrada.status
                            }
                          </span>

                          <h3>
                            {entrada.title}
                          </h3>

                          {
                            entrada.details
                              ? (
                                <p>
                                  {entrada.details}
                                </p>
                              )
                              : null
                          }

                        </div>


                        <div className="area-agenda-meta">

                          <span>
                            <Clock3 size={15} />

                            {
                              horaVisual(
                                entrada.starts_at,
                              )
                            }
                          </span>

                          {
                            espacio
                              ? (
                                <span>
                                  <MapPin size={15} />
                                  {espacio}
                                </span>
                              )
                              : null
                          }

                        </div>


                        {
                          pendientes.length > 0
                            ? (
                              <div className="area-agenda-missing">
                                Falta completar:{" "}
                                {pendientes.join(", ")}
                              </div>
                            )
                            : null
                        }


                        <Link
                          className="area-agenda-edit"
                          href={`/eventos/${entrada.id}/editar`}
                        >
                          Ver / editar
                        </Link>

                      </article>
                    );
                  },
                )
              }

            </div>

          )
          : (

            <div className="area-agenda-empty">

              <CalendarDays size={28} />

              <div>
                <strong>
                  Sin actividades próximas cargadas
                </strong>

                <span>
                  Usá “Cargar actividad” para incorporar la agenda de este espacio.
                </span>
              </div>

            </div>

          )
      }


      <div className="area-agenda-footer">

        <Link href="/agenda">
          Ver agenda general →
        </Link>

      </div>

    </section>
  );
}