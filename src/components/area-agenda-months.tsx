"use client";

import Link from "next/link";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  actualizarAgendaRapida,
  type AgendaQuickState,
} from "@/app/(plataforma)/areas/agenda-actions";


export type AreaAgendaItem = {
  id: string;
  titulo: string;
  detalle: string;
  estado: string;
  categoria: string;
  espacioId: string | null;
  espacio: string | null;
  fecha: string | null;
  inicio: string | null;
  fechaFin: string | null;
  faltantes: string[];
};


type EspacioOption = {
  id: string;
  nombre: string;
};


type Props = {
  areaName: string;
  entradas: AreaAgendaItem[];
  hrefCarga: string;
  espacios: EspacioOption[];
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


function horaInput(
  valor: string | null,
) {

  if (!valor) {
    return "";
  }


  const partes =
    new Intl.DateTimeFormat(
      "en",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,

        timeZone:
          "America/Argentina/Buenos_Aires",
      },
    ).formatToParts(
      new Date(valor),
    );


  const hour =
    partes.find(
      (parte) =>
        parte.type === "hour",
    )?.value ?? "";


  const minute =
    partes.find(
      (parte) =>
        parte.type === "minute",
    )?.value ?? "";


  return `${hour}:${minute}`;
}


function claveMes(
  entrada: AreaAgendaItem,
) {

  if (entrada.fecha) {
    return entrada.fecha.slice(
      0,
      7,
    );
  }


  if (entrada.inicio) {
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

  const partes =
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
    partes.find(
      (item) =>
        item.type === "year",
    )?.value ?? "";


  const month =
    partes.find(
      (item) =>
        item.type === "month",
    )?.value ?? "";


  return `${year}-${month}`;
}


function nombreMes(
  clave: string,
) {

  if (
    clave ===
    "sin-fecha"
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
    clave ===
    "sin-fecha"
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


  if (!fecha) {
    return "--";
  }


  const inicio =
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

    const fin =
      entrada.fechaFin.slice(
        8,
        10,
      );


    if (
      fin !== inicio
    ) {
      return `${inicio}–${fin}`;
    }
  }


  return inicio;
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


const estadoInicial:
AgendaQuickState = {
  ok: false,
  mensaje: "",
};


function AgendaCard({
  entrada,
  mesActivo,
  espacios,
}: {
  entrada: AreaAgendaItem;
  mesActivo: string;
  espacios: EspacioOption[];
}) {

  const [
    editando,
    setEditando,
  ] =
    useState(false);


  const accion =
    actualizarAgendaRapida.bind(
      null,
      entrada.id,
    );


  const [
    estado,
    formAction,
    guardando,
  ] =
    useActionState(
      accion,
      estadoInicial,
    );


  useEffect(
    () => {

      if (estado.ok) {
        setEditando(false);
      }

    },
    [estado.ok],
  );


  const faltantes =
    faltantesReales(
      entrada,
    );


  const completa =
    faltantes.length === 0;


  if (editando) {

    return (
      <article className="area-agenda-card agenda-quick-edit-card">

        <form
          action={formAction}
          className="agenda-quick-form"
        >

          <div className="agenda-quick-title">

            <strong>
              Editar actividad
            </strong>

            <button
              type="button"
              className="agenda-quick-close"
              onClick={
                () =>
                  setEditando(
                    false,
                  )
              }
              aria-label="Cancelar edición"
            >
              <X size={16} />
            </button>

          </div>


          <label className="agenda-quick-wide">

            <span>
              Título
            </span>

            <input
              name="title"
              defaultValue={
                entrada.titulo
              }
              required
            />

          </label>


          <div className="agenda-quick-two">

            <label>

              <span>
                Fecha
              </span>

              <input
                type="date"
                name="date"
                defaultValue={
                  entrada.fecha ??
                  (
                    entrada.inicio
                      ? fechaArgentina(
                          entrada.inicio,
                        )
                      : ""
                  )
                }
              />

            </label>


            <label>

              <span>
                Hora
              </span>

              <input
                type="time"
                name="time"
                defaultValue={
                  horaInput(
                    entrada.inicio,
                  )
                }
              />

            </label>

          </div>


          <div className="agenda-quick-two">

            <label>

              <span>
                Tipo
              </span>

              <select
                name="category"
                defaultValue={
                  entrada.categoria
                }
              >

                <option value="evento">
                  Evento
                </option>

                <option value="taller">
                  Taller
                </option>

                <option value="propuesta_educativa">
                  Propuesta educativa
                </option>

                <option value="reunion">
                  Reunión
                </option>

                <option value="otro">
                  Otra actividad
                </option>

              </select>

            </label>


            <label>

              <span>
                Estado
              </span>

              <select
                name="status"
                defaultValue={
                  entrada.estado
                }
              >

                <option value="borrador">
                  Borrador
                </option>

                <option value="pendiente">
                  Pendiente
                </option>

                <option value="confirmado">
                  Confirmado
                </option>

                <option value="completado">
                  Completado
                </option>

              </select>

            </label>

          </div>


          <label className="agenda-quick-wide">

            <span>
              Espacio / sede
            </span>

            <select
              name="space_id"
              defaultValue={
                entrada.espacioId ??
                ""
              }
            >

              <option value="">
                Toda la dependencia / sin definir
              </option>

              {
                espacios.map(
                  (espacio) => (
                    <option
                      value={
                        espacio.id
                      }
                      key={
                        espacio.id
                      }
                    >
                      {
                        espacio.nombre
                      }
                    </option>
                  ),
                )
              }

            </select>

          </label>


          <label className="agenda-quick-wide">

            <span>
              Detalle
            </span>

            <textarea
              name="details"
              rows={4}
              defaultValue={
                entrada.detalle
              }
            />

          </label>


          {
            estado.mensaje &&
            !estado.ok
              ? (
                <div className="agenda-quick-error">
                  <TriangleAlert
                    size={14}
                  />

                  {
                    estado.mensaje
                  }
                </div>
              )
              : null
          }


          <div className="agenda-quick-actions">

            <button
              type="button"
              className="button secondary"
              onClick={
                () =>
                  setEditando(
                    false,
                  )
              }
              disabled={
                guardando
              }
            >
              <X size={15} />

              Cancelar
            </button>


            <button
              type="submit"
              className="button primary"
              disabled={
                guardando
              }
            >
              <Check size={16} />

              {
                guardando
                  ? "Guardando..."
                  : "Guardar"
              }
            </button>

          </div>

        </form>

      </article>
    );
  }


  return (
    <article
      className={`area-agenda-card agenda-cat-${entrada.categoria}`}
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
              entrada.estado
            ] ??
            entrada.estado
          }
        </span>


        <h3>
          {entrada.titulo}
        </h3>


        {
          entrada.detalle
            ? (
              <p>
                {entrada.detalle}
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
              entrada,
            )
          }
        </span>


        {
          entrada.espacio
            ? (
              <span>

                <MapPin size={15} />

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


      <div className="area-agenda-card-actions">

        <button
          type="button"
          className="area-agenda-quick-edit"
          onClick={
            () =>
              setEditando(
                true,
              )
          }
        >
          <Pencil size={14} />

          Editar
        </button>


        <Link
          className="area-agenda-edit"
          href={`/eventos/${entrada.id}/editar`}
        >
          Edición completa
        </Link>

      </div>

    </article>
  );
}


export function AreaAgendaMonths({
  areaName,
  entradas,
  hrefCarga,
  espacios,
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
              a ===
              "sin-fecha"
            ) {
              return 1;
            }

            if (
              b ===
              "sin-fecha"
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


  function obtenerMesInicial() {

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


    if (proximo) {
      return proximo;
    }


    const ultimo =
      [...claves]
        .reverse()
        .find(
          (clave) =>
            clave !==
            "sin-fecha",
        );


    return (
      ultimo ??
      claves[0] ??
      "sin-fecha"
    );
  }


  const [
    mesSeleccionado,
    setMesSeleccionado,
  ] =
    useState(
      obtenerMesInicial,
    );


  /*
   * Si al editar una fecha la actividad
   * cambia de mes y el mes anterior queda vacío,
   * no dejamos la pantalla en blanco.
   */

  const mesActivo =
    claves.includes(
      mesSeleccionado,
    )
      ? mesSeleccionado
      : obtenerMesInicial();


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
            Actividades organizadas por mes. Podés editar fecha, hora y datos directamente desde cada card.
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
                            .filter(Boolean)
                            .join(" ")}
                          onClick={
                            () =>
                              setMesSeleccionado(
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
                  .filter(Boolean)
                  .join(" ")}
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
                      (entrada) => (
                        <AgendaCard
                          key={
                            entrada.id
                          }
                          entrada={
                            entrada
                          }
                          mesActivo={
                            mesActivo
                          }
                          espacios={
                            espacios
                          }
                        />
                      ),
                    )
                  }

                </div>

              </div>

            </>
          )
          : (
            <div className="area-agenda-empty">

              <CalendarDays size={28} />

              <div>

                <strong>
                  Sin actividades cargadas
                </strong>

                <span>
                  Usá “Cargar actividad” para incorporar la agenda.
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