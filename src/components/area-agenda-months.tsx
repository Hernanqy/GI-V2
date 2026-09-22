"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  TriangleAlert,
} from "lucide-react";


export type AreaAgendaItem = {
  id: string;
  titulo: string;
  detalle: string;
  estado: string;
  categoria: string;
  espacio: string | null;
  fecha: string | null;
  inicio: string | null;
  fechaFin: string | null;
  faltantes: string[];
};


type Props = {
  areaName: string;
  entradas: AreaAgendaItem[];
  hrefCarga: string;
};


const categoriaLabel:
Record<string, string> = {
  evento:
    "Evento",

  taller:
    "Taller",

  propuesta_educativa:
    "Propuesta educativa",

  reunion:
    "Reunión",

  otro:
    "Actividad",
};


const estadoLabel:
Record<string, string> = {
  borrador:
    "Borrador",

  pendiente:
    "Pendiente",

  confirmado:
    "Confirmado",

  completado:
    "Completado",
};


function fechaArgentina(
  valor: string,
) {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",

      timeZone:
        "America/Argentina/Buenos_Aires",
    },
  ).format(
    new Date(valor),
  );
}


function claveMes(
  entrada: AreaAgendaItem,
) {

  if (
    entrada.fecha
  ) {
    return entrada.fecha.slice(
      0,
      7,
    );
  }


  if (
    entrada.inicio
  ) {
    return fechaArgentina(
      entrada.inicio,
    ).slice(
      0,
      7,
    );
  }


  return "sin-fecha";
}


function claveMesActual() {

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
      (item) =>
        item.type === "year",
    )?.value ?? "";


  const month =
    parts.find(
      (item) =>
        item.type === "month",
    )?.value ?? "";


  return `${year}-${month}`;
}


function nombreMes(
  clave: string,
) {

  if (
    clave === "sin-fecha"
  ) {
    return "A DEFINIR";
  }


  const [
    year,
    month,
  ] =
    clave
      .split("-")
      .map(Number);


  return new Intl.DateTimeFormat(
    "es-AR",
    {
      month: "short",
      year: "numeric",

      timeZone: "UTC",
    },
  )
    .format(
      new Date(
        Date.UTC(
          year,
          month - 1,
          1,
        ),
      ),
    )
    .replace(".", "")
    .toUpperCase();
}


function nombreMesCompleto(
  clave: string,
) {

  if (
    clave === "sin-fecha"
  ) {
    return "Sin fecha / A definir";
  }


  const [
    year,
    month,
  ] =
    clave
      .split("-")
      .map(Number);


  const texto =
    new Intl.DateTimeFormat(
      "es-AR",
      {
        month: "long",
        year: "numeric",

        timeZone: "UTC",
      },
    ).format(
      new Date(
        Date.UTC(
          year,
          month - 1,
          1,
        ),
      ),
    );


  return (
    texto
      .charAt(0)
      .toUpperCase() +
    texto.slice(1)
  );
}


function diaVisual(
  entrada: AreaAgendaItem,
) {

  const fecha =
    entrada.fecha ??
    (
      entrada.inicio
        ? fechaArgentina(
            entrada.inicio,
          )
        : null
    );


  if (
    !fecha
  ) {
    return "--";
  }


  const diaInicio =
    fecha.slice(
      8,
      10,
    );


  if (
    entrada.fechaFin &&
    entrada.fechaFin.slice(
      0,
      7,
    ) ===
      fecha.slice(
        0,
        7,
      )
  ) {

    const diaFin =
      entrada.fechaFin.slice(
        8,
        10,
      );


    if (
      diaFin !==
      diaInicio
    ) {
      return `${diaInicio}–${diaFin}`;
    }
  }


  return diaInicio;
}


function horaVisual(
  entrada: AreaAgendaItem,
) {

  if (
    !entrada.inicio
  ) {
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
    new Date(
      entrada.inicio,
    ),
  );
}


function faltantesReales(
  entrada: AreaAgendaItem,
) {

  const faltantes =
    new Set(
      entrada.faltantes,
    );


  if (
    !entrada.fecha &&
    !entrada.inicio
  ) {
    faltantes.add(
      "fecha",
    );
  }


  if (
    entrada.fecha &&
    !entrada.inicio
  ) {
    faltantes.add(
      "hora",
    );
  }


  return [
    ...faltantes,
  ];
}


export function AreaAgendaMonths({
  areaName,
  entradas,
  hrefCarga,
}: Props) {

  const mesActual =
    claveMesActual();


  const grupos =
    useMemo(
      () => {

        const mapa =
          new Map<
            string,
            AreaAgendaItem[]
          >();


        entradas.forEach(
          (entrada) => {

            const clave =
              claveMes(
                entrada,
              );


            const actuales =
              mapa.get(
                clave,
              ) ?? [];


            actuales.push(
              entrada,
            );


            mapa.set(
              clave,
              actuales,
            );
          },
        );


        return Array.from(
          mapa.entries(),
        ).sort(
          (
            [a],
            [b],
          ) => {

            if (
              a === "sin-fecha"
            ) {
              return 1;
            }

            if (
              b === "sin-fecha"
            ) {
              return -1;
            }

            return a.localeCompare(
              b,
            );
          },
        );
      },
      [entradas],
    );


  const claves =
    grupos.map(
      ([clave]) =>
        clave,
    );


  function mesInicial() {

    if (
      claves.includes(
        mesActual,
      )
    ) {
      return mesActual;
    }


    const proximo =
      claves.find(
        (clave) =>
          clave !==
            "sin-fecha" &&
          clave >
            mesActual,
      );


    if (
      proximo
    ) {
      return proximo;
    }


    const ultimoConFecha =
      [...claves]
        .reverse()
        .find(
          (clave) =>
            clave !==
            "sin-fecha",
        );


    return (
      ultimoConFecha ??
      claves[0] ??
      "sin-fecha"
    );
  }


  const [
    mesActivo,
    setMesActivo,
  ] =
    useState(
      mesInicial,
    );


  const grupoActivo =
    grupos.find(
      ([clave]) =>
        clave ===
        mesActivo,
    );


  const items =
    grupoActivo?.[1] ??
    [];


  return (
    <section className="area-agenda-section area-agenda-monthly">

      <div className="area-agenda-heading">

        <div>

          <span className="eyebrow">
            Agenda
          </span>

          <h2>
            Programación de {areaName}
          </h2>

          <p>
            Actividades organizadas por mes. Seleccioná un mes para ver su programación.
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
        grupos.length > 0
          ? (
            <>

              <div
                className="area-agenda-month-tabs"
                role="tablist"
                aria-label="Meses de la agenda"
              >

                {
                  grupos.map(
                    (
                      [
                        clave,
                        actividades,
                      ],
                    ) => {

                      const activo =
                        clave ===
                        mesActivo;


                      const actual =
                        clave ===
                        mesActual;


                      return (
                        <button
                          key={clave}
                          type="button"
                          role="tab"
                          aria-selected={
                            activo
                          }
                          className={[
                            "area-agenda-month-tab",

                            activo
                              ? "active"
                              : "",

                            actual
                              ? "current"
                              : "",

                            clave ===
                              "sin-fecha"
                              ? "undated"
                              : "",
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(
                              " ",
                            )}
                          onClick={
                            () =>
                              setMesActivo(
                                clave,
                              )
                          }
                        >

                          <span>
                            {
                              nombreMes(
                                clave,
                              )
                            }
                          </span>

                          <strong>
                            {
                              actividades.length
                            }
                          </strong>

                        </button>
                      );
                    },
                  )
                }

              </div>


              <div
                className={[
                  "area-agenda-active-month",

                  mesActivo ===
                    mesActual
                    ? "is-current"
                    : "",

                  mesActivo ===
                    "sin-fecha"
                    ? "is-undated"
                    : "",
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )}
              >

                <div className="area-agenda-month-title">

                  <div>

                    <span>
                      {
                        mesActivo ===
                          mesActual
                          ? "MES ACTUAL"
                          : (
                              mesActivo ===
                                "sin-fecha"
                                ? "PENDIENTE DE DEFINICIÓN"
                                : "AGENDA DEL MES"
                            )
                      }
                    </span>

                    <h3>
                      {
                        nombreMesCompleto(
                          mesActivo,
                        )
                      }
                    </h3>

                  </div>


                  <strong>
                    {items.length}{" "}
                    {
                      items.length === 1
                        ? "actividad"
                        : "actividades"
                    }
                  </strong>

                </div>


                <div className="area-agenda-grid">

                  {
                    items.map(
                      (entrada) => {

                        const faltantes =
                          faltantesReales(
                            entrada,
                          );


                        const completa =
                          faltantes.length ===
                          0;


                        return (
                          <article
                            className={`area-agenda-card agenda-cat-${entrada.categoria}`}
                            key={
                              entrada.id
                            }
                          >

                            <div className="area-agenda-card-top">

                              <div className="area-agenda-date">

                                <strong>
                                  {
                                    diaVisual(
                                      entrada,
                                    )
                                  }
                                </strong>

                                <span>
                                  {
                                    mesActivo ===
                                      "sin-fecha"
                                      ? "A DEFINIR"
                                      : nombreMes(
                                          mesActivo,
                                        ).split(
                                          " ",
                                        )[0]
                                  }
                                </span>

                              </div>


                              <div className="area-agenda-badges">

                                <span className="agenda-type-chip">
                                  {
                                    categoriaLabel[
                                      entrada.categoria
                                    ] ??
                                    "Actividad"
                                  }
                                </span>


                                {
                                  completa
                                    ? (
                                      <span className="agenda-ready-chip">

                                        <CheckCircle2
                                          size={12}
                                        />

                                        Lista
                                      </span>
                                    )
                                    : (
                                      <span className="agenda-warning-chip">

                                        <TriangleAlert
                                          size={12}
                                        />

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
                                    entrada.estado
                                  ] ??
                                  entrada.estado
                                }
                              </span>


                              <h3>
                                {
                                  entrada.titulo
                                }
                              </h3>


                              {
                                entrada.detalle
                                  ? (
                                    <p>
                                      {
                                        entrada.detalle
                                      }
                                    </p>
                                  )
                                  : null
                              }

                            </div>


                            <div className="area-agenda-meta">

                              <span>
                                <Clock3
                                  size={15}
                                />

                                {
                                  horaVisual(
                                    entrada,
                                  )
                                }
                              </span>


                              {
                                entrada.espacio
                                  ? (
                                    <span>

                                      <MapPin
                                        size={15}
                                      />

                                      {
                                        entrada.espacio
                                      }
                                    </span>
                                  )
                                  : null
                              }

                            </div>


                            {
                              !completa
                                ? (
                                  <div className="area-agenda-missing">

                                    Falta completar:{" "}

                                    {
                                      faltantes.join(
                                        ", ",
                                      )
                                    }

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

              </div>

            </>
          )
          : (
            <div className="area-agenda-empty">

              <CalendarDays
                size={28}
              />

              <div>

                <strong>
                  Sin actividades cargadas
                </strong>

                <span>
                  Usá “Cargar actividad” para incorporar la agenda de esta dependencia.
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