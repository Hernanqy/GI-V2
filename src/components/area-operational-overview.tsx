import Link from "next/link";

import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleAlert,
  Clock3,
  GraduationCap,
  MapPin,
  Phone,
  UserRound,
  Users,
} from "lucide-react";

import {
  OperationalCardEditor,
  type OperationalLocation,
} from "@/components/operational-card-editor";

import {
  createClient,
} from "@/lib/supabase/server";

import type {
  EspacioCultural,
} from "@/lib/areas-data";


type Props = {
  areaId: string;
  areaSlug: string;
  areaName: string;
  espacios: EspacioCultural[];
  editable?: boolean;
};


type EntryRow = {
  id: string;
  title: string;
  starts_at: string | null;
  space_id: string | null;
  status: string;
};


type MetricRow = {
  space_id: string;
  visitors_count: number | null;
  participants_count: number | null;
};


function fechaAgenda(
  valor: string | null,
) {

  if (!valor) {
    return "";
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone:
        "America/Argentina/Buenos_Aires",
    },
  ).format(fecha);
}


function valorMetrica(
  valor:
    number |
    null |
    undefined,
) {

  if (
    valor === null ||
    valor === undefined
  ) {
    return "Sin carga";
  }

  return new Intl.NumberFormat(
    "es-AR",
  ).format(valor);
}


function agendaEspacio(
  entradas: EntryRow[],
  spaceId: string,
  usarAgendaArea: boolean,
) {

  return entradas
    .filter(
      (item) => {

        if (
          item.status ===
            "cancelado" ||
          item.status ===
            "completado"
        ) {
          return false;
        }

        if (
          item.space_id ===
          spaceId
        ) {
          return true;
        }

        return (
          usarAgendaArea &&
          !item.space_id
        );
      },
    )
    .sort(
      (a, b) =>
        new Date(
          a.starts_at ?? 0,
        ).getTime() -
        new Date(
          b.starts_at ?? 0,
        ).getTime(),
    );
}


function etiquetaEstado(
  estado: string,
) {

  const valores:
    Record<string, string> = {

    activo:
      "Activo",

    actividad_parcial:
      "Actividad parcial",

    cerrado_temporalmente:
      "Cerrado temporalmente",

    sin_referente:
      "Sin referente",

    a_confirmar:
      "A confirmar",
  };

  return (
    valores[estado] ??
    "A confirmar"
  );
}


function mesActual() {

  const parts =
    new Intl.DateTimeFormat(
      "en",
      {
        year: "numeric",
        month: "2-digit",
        timeZone:
          "America/Argentina/Buenos_Aires",
      },
    ).formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (x) =>
        x.type === "year",
    )?.value;

  const month =
    parts.find(
      (x) =>
        x.type === "month",
    )?.value;

  return `${year}-${month}-01`;
}


export async function AreaOperationalOverview({
  areaId,
  areaSlug,
  areaName,
  espacios,
  editable = false,
}: Props) {

  const supabase =
    await createClient();

  const db =
    supabase as any;

  const ahora =
    new Date();

  const inicioMes =
    mesActual();

  const etiquetaMes =
    new Intl.DateTimeFormat(
      "es-AR",
      {
        month: "long",
        year: "numeric",
        timeZone:
          "America/Argentina/Buenos_Aires",
      },
    ).format(ahora);


  const {
    data: entriesData,
  } =
    await db
      .from("entries")
      .select(
        "id, title, starts_at, space_id, status",
      )
      .eq(
        "area_id",
        areaId,
      )
      .gte(
        "starts_at",
        ahora.toISOString(),
      )
      .order(
        "starts_at",
        {
          ascending: true,
        },
      )
      .limit(200);


  const ids =
    espacios.map(
      (item) =>
        item.id,
    );


  let ubicaciones:
    OperationalLocation[] = [];

  let metricas:
    MetricRow[] = [];


  if (
    ids.length > 0
  ) {

    const [
      locationsResult,
      metricsResult,
    ] =
      await Promise.all([

        db
          .from(
            "space_locations",
          )
          .select(
            `
              id,
              space_id,
              venue_name,
              locality,
              address,
              schedule_text,
              location_validated,
              is_primary
            `,
          )
          .in(
            "space_id",
            ids,
          )
          .eq(
            "active",
            true,
          )
          .order(
            "is_primary",
            {
              ascending: false,
            },
          )
          .order(
            "venue_name",
          ),


        db
          .from(
            "space_monthly_metrics",
          )
          .select(
            `
              space_id,
              visitors_count,
              participants_count
            `,
          )
          .in(
            "space_id",
            ids,
          )
          .eq(
            "period_month",
            inicioMes,
          ),

      ]);


    ubicaciones =
      locationsResult.data ??
      [];

    metricas =
      metricsResult.data ??
      [];
  }


  const entradas:
    EntryRow[] =
    entriesData ??
    [];


  const esEducacion =
    areaSlug ===
    "educacion-artistica";


  const usarAgendaArea =
    espacios.length === 1;


  if (
    espacios.length === 0
  ) {

    return (
      <section className="panel operational-overview">

        <div className="operational-overview-heading">

          <div>
            <span className="eyebrow">
              Información actual
            </span>

            <h2>
              Datos operativos
            </h2>

            <p>
              Todavía no hay espacios cargados para mostrar información dinámica.
            </p>
          </div>

        </div>

      </section>
    );
  }


  return (
    <section
      className={`panel operational-overview ${
        esEducacion
          ? "education-overview"
          : ""
      }`}
    >

      <div className="operational-overview-heading">

        <div>

          <span className="eyebrow">
            Información actual
          </span>

          <h2>
            {
              esEducacion
                ? "Escuelas municipales · datos y sedes"
                : "Datos operativos de los espacios"
            }
          </h2>

          <p>
            {
              esEducacion
                ? "Responsables, sedes, días, horarios, contacto, participantes y agenda."
                : "Ubicación, responsable, horarios, contacto, visitantes y próxima agenda."
            }
          </p>

        </div>


        <span className="operational-overview-count">

          {espacios.length}{" "}

          {
            espacios.length === 1
              ? "espacio"
              : "espacios"
          }

        </span>

      </div>


      <div
        className={
          esEducacion
            ? "school-overview-grid"
            : "space-overview-grid"
        }
      >

        {
          espacios.map(
            (espacio) => {

              const agenda =
                agendaEspacio(
                  entradas,
                  espacio.id,
                  usarAgendaArea,
                );


              const proximo =
                agenda[0];


              const metrica =
                metricas.find(
                  (item) =>
                    item.space_id ===
                    espacio.id,
                );


              const sedes =
                ubicaciones.filter(
                  (item) =>
                    item.space_id ===
                    espacio.id,
                );


              const ubicacion =
                [
                  espacio.direccion,
                  espacio.localidad,
                ]
                  .filter(Boolean)
                  .join(" · ");


              const editor =
                editable
                  ? (
                    <OperationalCardEditor
                      areaId={areaId}
                      areaSlug={areaSlug}
                      espacio={espacio}
                      esEducacion={esEducacion}
                      metricMonth={inicioMes}
                      metricValue={
                        esEducacion
                          ? (
                              metrica
                                ?.participants_count ??
                              null
                            )
                          : (
                              metrica
                                ?.visitors_count ??
                              null
                            )
                      }
                      sedes={sedes}
                    />
                  )
                  : null;


              if (esEducacion) {

                return (
                  <article
                    className="school-overview-card"
                    key={espacio.id}
                  >

                    <header className="overview-card-header">

                      <span className="overview-card-icon education">
                        <GraduationCap size={20} />
                      </span>


                      <div>

                        <strong>
                          {espacio.nombre}
                        </strong>

                        <small>
                          {sedes.length}{" "}
                          {
                            sedes.length === 1
                              ? "sede registrada"
                              : "sedes registradas"
                          }
                        </small>

                      </div>


                      <span
                        className={`overview-status ${
                          espacio.estadoOperativo ===
                            "activo"
                            ? "is-active"
                            : ""
                        }`}
                      >
                        {
                          etiquetaEstado(
                            espacio.estadoOperativo,
                          )
                        }
                      </span>

                    </header>


                    <div className="school-key-data">

                      <div>

                        <UserRound size={17} />

                        <span>
                          <small>
                            Responsable
                          </small>

                          <strong>
                            {
                              espacio.responsable ||
                              "A completar"
                            }
                          </strong>
                        </span>

                      </div>


                      <div>

                        <Phone size={17} />

                        <span>
                          <small>
                            Contacto
                          </small>

                          <strong>
                            {
                              espacio.contacto ||
                              "A completar"
                            }
                          </strong>
                        </span>

                      </div>


                      <div>

                        <Users size={17} />

                        <span>
                          <small>
                            Participantes · {etiquetaMes}
                          </small>

                          <strong>
                            {
                              valorMetrica(
                                metrica
                                  ?.participants_count,
                              )
                            }
                          </strong>
                        </span>

                      </div>


                      <div>

                        <CalendarDays size={17} />

                        <span>
                          <small>
                            Agenda próxima
                          </small>

                          <strong>
                            {
                              agenda.length === 0
                                ? "Sin actividades"
                                : `${agenda.length} ${
                                    agenda.length === 1
                                      ? "actividad"
                                      : "actividades"
                                  }`
                            }
                          </strong>

                          {
                            proximo
                              ? (
                                <em>
                                  {
                                    fechaAgenda(
                                      proximo.starts_at,
                                    )
                                  }
                                  {" · "}
                                  {
                                    proximo.title
                                  }
                                </em>
                              )
                              : null
                          }
                        </span>

                      </div>

                    </div>


                    <details
                      className="school-venues"
                      open={
                        sedes.length > 0 &&
                        sedes.length <= 2
                      }
                    >

                      <summary>

                        <span>
                          <MapPin size={16} />
                          Sedes y horarios
                        </span>

                        <strong>
                          {sedes.length}
                        </strong>

                      </summary>


                      <div className="school-venue-list">

                        {
                          sedes.length === 0
                            ? (
                              <div className="school-venue-empty">

                                <CircleAlert size={16} />

                                <span>
                                  No hay sedes específicas vinculadas.
                                </span>

                              </div>
                            )
                            : (
                              sedes.map(
                                (sede) => (
                                  <div
                                    className="school-venue-row"
                                    key={sede.id}
                                  >

                                    <span className="school-venue-marker">
                                      <MapPin size={15} />
                                    </span>


                                    <span>

                                      <strong>
                                        {sede.venue_name}

                                        {
                                          sede.is_primary
                                            ? " · Principal"
                                            : ""
                                        }
                                      </strong>


                                      <small>
                                        {
                                          [
                                            sede.address,
                                            sede.locality,
                                          ]
                                            .filter(Boolean)
                                            .join(" · ")
                                          ||
                                          "Dirección a completar"
                                        }
                                      </small>


                                      <em>
                                        <Clock3 size={13} />

                                        {
                                          sede.schedule_text ||
                                          "Días y horarios a completar"
                                        }
                                      </em>

                                    </span>


                                    {
                                      sede.location_validated
                                        ? (
                                          <BadgeCheck
                                            className="school-venue-valid"
                                            size={17}
                                          />
                                        )
                                        : (
                                          <CircleAlert
                                            className="school-venue-pending"
                                            size={17}
                                          />
                                        )
                                    }

                                  </div>
                                ),
                              )
                            )
                        }

                      </div>

                    </details>


                    {editor}

                  </article>
                );
              }


              return (
                <article
                  className="space-overview-card"
                  key={espacio.id}
                >

                  <header className="overview-card-header">

                    <span className="overview-card-icon">
                      <Building2 size={20} />
                    </span>


                    <div>

                      <strong>
                        {espacio.nombre}
                      </strong>

                      <small>
                        {
                          espacio.tipo ||
                          areaName
                        }
                      </small>

                    </div>


                    <span
                      className={`overview-status ${
                        espacio.estadoOperativo ===
                          "activo"
                          ? "is-active"
                          : ""
                      }`}
                    >
                      {
                        etiquetaEstado(
                          espacio.estadoOperativo,
                        )
                      }
                    </span>

                  </header>


                  <div className="operational-data-grid">

                    <div className="operational-data-item">

                      <MapPin size={18} />

                      <span>
                        <small>
                          Ubicación
                        </small>

                        <strong>
                          {
                            ubicacion ||
                            "A completar"
                          }
                        </strong>
                      </span>

                    </div>


                    <div className="operational-data-item">

                      <UserRound size={18} />

                      <span>
                        <small>
                          Responsable / referente
                        </small>

                        <strong>
                          {
                            espacio.responsable ||
                            "A completar"
                          }
                        </strong>
                      </span>

                    </div>


                    <div className="operational-data-item">

                      <Clock3 size={18} />

                      <span>
                        <small>
                          Horarios
                        </small>

                        <strong>
                          {
                            espacio.horarios ||
                            "A completar"
                          }
                        </strong>
                      </span>

                    </div>


                    <div className="operational-data-item">

                      <Phone size={18} />

                      <span>
                        <small>
                          Contacto
                        </small>

                        <strong>
                          {
                            espacio.contacto ||
                            "A completar"
                          }
                        </strong>
                      </span>

                    </div>


                    <div className="operational-data-item metric">

                      <Users size={18} />

                      <span>
                        <small>
                          Visitantes · {etiquetaMes}
                        </small>

                        <strong>
                          {
                            valorMetrica(
                              metrica
                                ?.visitors_count,
                            )
                          }
                        </strong>
                      </span>

                    </div>


                    <div className="operational-data-item metric">

                      <CalendarDays size={18} />

                      <span>
                        <small>
                          Agenda próxima
                        </small>

                        <strong>
                          {
                            agenda.length === 0
                              ? "Sin actividades"
                              : `${agenda.length} ${
                                  agenda.length === 1
                                    ? "actividad"
                                    : "actividades"
                                }`
                          }
                        </strong>

                        {
                          proximo
                            ? (
                              <em>
                                {
                                  fechaAgenda(
                                    proximo.starts_at,
                                  )
                                }
                                {" · "}
                                {
                                  proximo.title
                                }
                              </em>
                            )
                            : null
                        }
                      </span>

                    </div>

                  </div>


                  <div className="overview-card-links">

                    <Link href="/mapa">
                      Ver en mapa
                    </Link>

                    <Link href="/agenda">
                      Abrir agenda
                    </Link>

                  </div>


                  {editor}

                </article>
              );
            },
          )
        }

      </div>


      <div className="operational-metric-note">

        <CircleAlert size={16} />

        <span>
          Visitantes y participantes se muestran por mes.
          Cuando todavía no existe una carga estadística aparece “Sin carga”.
        </span>

      </div>

    </section>
  );
}