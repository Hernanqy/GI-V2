"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  CalendarCheck,
  CalendarX2,
  Clock3,
  Filter,
  Search,
  TriangleAlert,
} from "lucide-react";

import type {
  EntradaAgenda,
} from "@/lib/agenda-data";


const etiquetasEstado:
Record<string, string> = {
  borrador: "Borrador",
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
};


const etiquetasCategoria:
Record<string, string> = {
  evento: "Evento",
  taller: "Taller",
  propuesta_educativa:
    "Propuesta educativa",
  reunion: "Reunión",
  otro: "Actividad",
};


function claveMes(
  fecha: string,
) {

  const date =
    new Date(fecha);

  const year =
    new Intl.DateTimeFormat(
      "en",
      {
        year: "numeric",
        timeZone:
          "America/Argentina/Buenos_Aires",
      },
    ).format(date);

  const month =
    new Intl.DateTimeFormat(
      "en",
      {
        month: "2-digit",
        timeZone:
          "America/Argentina/Buenos_Aires",
      },
    ).format(date);

  return `${year}-${month}`;
}


function etiquetaMes(
  clave: string,
) {

  const [year, month] =
    clave
      .split("-")
      .map(Number);

  const nombre =
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
    nombre
      .charAt(0)
      .toUpperCase() +
    nombre.slice(1)
  );
}


function mostrarFecha(
  entrada: EntradaAgenda,
) {

  const fecha =
    new Date(
      entrada.inicio,
    );

  const dia =
    new Intl.DateTimeFormat(
      "es-AR",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
        timeZone:
          "America/Argentina/Buenos_Aires",
      },
    ).format(fecha);


  if (
    !entrada.tieneHora
  ) {
    return `${dia} · horario pendiente`;
  }


  const hora =
    new Intl.DateTimeFormat(
      "es-AR",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone:
          "America/Argentina/Buenos_Aires",
      },
    ).format(fecha);


  return `${dia} · ${hora}`;
}


export function AgendaView({
  entradas,
}: {
  entradas: EntradaAgenda[];
}) {

  const [busqueda, setBusqueda] =
    useState("");

  const [area, setArea] =
    useState("");

  const [espacio, setEspacio] =
    useState("");

  const [estado, setEstado] =
    useState("");

  const [categoria, setCategoria] =
    useState("");

  const [completitud, setCompletitud] =
    useState("");


  const areas =
    useMemo(
      () =>
        Array.from(
          new Map(
            entradas.map(
              (entrada) => [
                entrada.areaId,
                entrada.area,
              ],
            ),
          ),
        ),
      [entradas],
    );


  const espacios =
    useMemo(
      () =>
        Array.from(
          new Map(
            entradas
              .filter(
                (entrada) =>
                  entrada.espacioId &&
                  (
                    !area ||
                    entrada.areaId ===
                      area
                  ),
              )
              .map(
                (entrada) => [
                  entrada.espacioId!,
                  entrada.espacio!,
                ],
              ),
          ),
        ),
      [
        entradas,
        area,
      ],
    );


  const filtradas =
    useMemo(
      () => {

        const texto =
          busqueda
            .trim()
            .toLocaleLowerCase(
              "es",
            );

        return entradas.filter(
          (entrada) => {

            if (
              area &&
              entrada.areaId !== area
            ) {
              return false;
            }

            if (
              espacio &&
              entrada.espacioId !==
                espacio
            ) {
              return false;
            }

            if (
              estado &&
              entrada.estado !== estado
            ) {
              return false;
            }

            if (
              categoria &&
              entrada.categoria !==
                categoria
            ) {
              return false;
            }

            if (
              completitud ===
                "completa" &&
              !entrada.completa
            ) {
              return false;
            }

            if (
              completitud ===
                "incompleta" &&
              entrada.completa
            ) {
              return false;
            }

            if (texto) {

              const bolsa =
                [
                  entrada.titulo,
                  entrada.detalle,
                  entrada.area,
                  entrada.espacio ?? "",
                ]
                  .join(" ")
                  .toLocaleLowerCase(
                    "es",
                  );

              if (
                !bolsa.includes(
                  texto,
                )
              ) {
                return false;
              }
            }

            return true;
          },
        );
      },
      [
        entradas,
        busqueda,
        area,
        espacio,
        estado,
        categoria,
        completitud,
      ],
    );


  const meses =
    Array.from(
      new Set(
        filtradas.map(
          (entrada) =>
            claveMes(
              entrada.inicio,
            ),
        ),
      ),
    );


  const [mesActivo, setMesActivo] =
    useState(
      meses[0] ?? "",
    );


  const mesReal =
    meses.includes(
      mesActivo,
    )
      ? mesActivo
      : (
          meses[0] ??
          ""
        );


  const items =
    filtradas.filter(
      (entrada) =>
        claveMes(
          entrada.inicio,
        ) === mesReal,
    );


  return (
    <section className="agenda-modern">

      <div className="agenda-filter-panel">

        <div className="agenda-search">
          <Search size={17} />

          <input
            value={busqueda}
            onChange={
              (event) =>
                setBusqueda(
                  event.target.value,
                )
            }
            placeholder="Buscar actividad, espacio o dependencia"
          />
        </div>


        <div className="agenda-filters">

          <span>
            <Filter size={15} />
            Filtros
          </span>


          <select
            value={area}
            onChange={
              (event) => {
                setArea(
                  event.target.value,
                );
                setEspacio("");
              }
            }
          >
            <option value="">
              Todas las dependencias
            </option>

            {
              areas.map(
                ([id, nombre]) => (
                  <option
                    value={id}
                    key={id}
                  >
                    {nombre}
                  </option>
                ),
              )
            }
          </select>


          <select
            value={espacio}
            onChange={
              (event) =>
                setEspacio(
                  event.target.value,
                )
            }
          >
            <option value="">
              Todos los espacios
            </option>

            {
              espacios.map(
                ([id, nombre]) => (
                  <option
                    value={id}
                    key={id}
                  >
                    {nombre}
                  </option>
                ),
              )
            }
          </select>


          <select
            value={categoria}
            onChange={
              (event) =>
                setCategoria(
                  event.target.value,
                )
            }
          >
            <option value="">
              Todos los tipos
            </option>

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
          </select>


          <select
            value={estado}
            onChange={
              (event) =>
                setEstado(
                  event.target.value,
                )
            }
          >
            <option value="">
              Todos los estados
            </option>

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


          <select
            value={completitud}
            onChange={
              (event) =>
                setCompletitud(
                  event.target.value,
                )
            }
          >
            <option value="">
              Completas e incompletas
            </option>

            <option value="completa">
              Solo completas
            </option>

            <option value="incompleta">
              Faltan datos
            </option>
          </select>

        </div>

      </div>


      {
        meses.length > 0
          ? (
            <div
              className="month-tabs"
              role="tablist"
            >

              {
                meses.map(
                  (mes) => (
                    <button
                      key={mes}
                      type="button"
                      role="tab"
                      aria-selected={
                        mesReal === mes
                      }
                      className={
                        mesReal === mes
                          ? "active"
                          : ""
                      }
                      onClick={
                        () =>
                          setMesActivo(
                            mes,
                          )
                      }
                    >
                      {etiquetaMes(mes)}
                    </button>
                  ),
                )
              }

            </div>
          )
          : null
      }


      {
        items.length > 0
          ? (
            <div className="agenda-global-grid">

              {
                items.map(
                  (item) => (

                    <article
                      className="agenda-global-card"
                      key={item.id}
                    >

                      <div className="agenda-global-card-head">

                        <span className="agenda-global-type">
                          {
                            etiquetasCategoria[
                              item.categoria
                            ] ||
                            "Actividad"
                          }
                        </span>


                        {
                          item.completa
                            ? (
                              <span className="agenda-global-ok">
                                <CalendarCheck size={13} />
                                Completa
                              </span>
                            )
                            : (
                              <span className="agenda-global-warning">
                                <TriangleAlert size={13} />
                                Faltan datos
                              </span>
                            )
                        }

                      </div>


                      <time>
                        <Clock3 size={15} />
                        {mostrarFecha(item)}
                      </time>


                      <h3>
                        <Link
                          href={`/eventos/${item.id}/editar`}
                        >
                          {item.titulo}
                        </Link>
                      </h3>


                      <p>
                        {item.area}

                        {
                          item.espacio
                            ? ` · ${item.espacio}`
                            : ""
                        }
                      </p>


                      <footer>

                        <span>
                          {
                            etiquetasEstado[
                              item.estado
                            ] ||
                            item.estado
                          }
                        </span>


                        {
                          !item.completa
                            ? (
                              <small>
                                Falta:{" "}
                                {
                                  item.faltantes.join(
                                    ", ",
                                  )
                                }
                              </small>
                            )
                            : null
                        }

                      </footer>

                    </article>
                  ),
                )
              }

            </div>
          )
          : (
            <div className="inline-empty">
              <CalendarX2 size={30} />

              <strong>
                Sin resultados
              </strong>

              <span>
                No hay actividades que coincidan con los filtros seleccionados.
              </span>
            </div>
          )
      }

    </section>
  );
}