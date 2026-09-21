"use client";

import {
  useActionState,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleAlert,
  Filter,
  LocateFixed,
  MapPin,
  Save,
  Search,
} from "lucide-react";

import {
  guardarUbicacion,
  type MapState,
} from "@/app/(plataforma)/mapa/actions";

type EspacioMapa = {
  id: string;
  areaId: string;
  areaSlug: string;
  areaNombre: string;

  nombre: string;
  tipo: string;
  localidad: string;
  direccion: string;

  latitud: number | null;
  longitud: number | null;
  validada: boolean;

  responsable: string;
  estado: string;
};

type DependenciaMapa = {
  slug: string;
  nombre: string;
};

type ResultadoBusqueda = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
};

const inicial: MapState = {
  ok: false,
  mensaje: "",
};

const CENTRO: [number, number] = [
  -36.8927,
  -60.3225,
];

function MapaLeaflet({
  espacios,
  espacio,
  latitud,
  longitud,
  editable,
  onCambiar,
}: {
  espacios: EspacioMapa[];
  espacio: EspacioMapa;
  latitud: number | null;
  longitud: number | null;
  editable: boolean;
  onCambiar: (lat: number, lon: number) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<any>(null);
  const capa = useRef<any>(null);
  const marcador = useRef<any>(null);
  const onCambiarRef = useRef(onCambiar);

  useEffect(() => {
    onCambiarRef.current = onCambiar;
  }, [onCambiar]);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      if (!contenedor.current || mapa.current) return;

      const L = await import("leaflet");

      if (cancelado || !contenedor.current) return;

      const instancia = L.map(contenedor.current, {
        center: CENTRO,
        zoom: 12,
      });

      L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      ).addTo(instancia);

      instancia.on("click", (evento: any) => {
        if (!editable) return;

        onCambiarRef.current(
          evento.latlng.lat,
          evento.latlng.lng,
        );
      });

      mapa.current = instancia;

      setTimeout(() => {
        instancia.invalidateSize();

        if (
          latitud !== null &&
          longitud !== null
        ) {
          instancia.flyTo(
            [latitud, longitud],
            17,
            {
              animate: true,
              duration: 0.6,
            },
          );
        }
      }, 150);
    }

    iniciar();

    return () => {
      cancelado = true;
    };
  }, [editable]);

  useEffect(() => {
    let cancelado = false;

    async function dibujar() {
      if (!mapa.current) return;

      const L = await import("leaflet");

      if (cancelado) return;

      if (capa.current) {
        capa.current.remove();
      }

      const grupo = L.layerGroup().addTo(mapa.current);
      capa.current = grupo;

      espacios
        .filter(
          (item) =>
            item.latitud !== null &&
            item.longitud !== null,
        )
        .forEach((item) => {
          const punto = L.circleMarker(
            [item.latitud!, item.longitud!],
            {
              radius: item.id === espacio.id ? 12 : 8,
              weight: item.id === espacio.id ? 4 : 3,
              fillOpacity: 0.92,
            },
          ).addTo(grupo);

          punto.bindTooltip(
            `<strong>${item.nombre}</strong><br>${item.areaNombre}`,
          );
        });
    }

    dibujar();

    return () => {
      cancelado = true;
    };
  }, [espacios, espacio.id]);

  useEffect(() => {
    let cancelado = false;

    async function seleccionar() {
      if (!mapa.current) return;

      const L = await import("leaflet");

      if (cancelado) return;

      if (marcador.current) {
        marcador.current.remove();
        marcador.current = null;
      }

      if (
        latitud !== null &&
        longitud !== null
      ) {
        marcador.current = L.circleMarker(
          [latitud, longitud],
          {
            radius: 11,
            weight: 4,
            fillOpacity: 0.65,
          },
        ).addTo(mapa.current);

        mapa.current.flyTo([latitud, longitud], 17, { animate: true, duration: 0.7 });
      } else {
        mapa.current.setView(CENTRO, 12);
      }
    }

    seleccionar();

    return () => {
      cancelado = true;
    };
  }, [latitud, longitud]);

  useEffect(() => {
    return () => {
      if (mapa.current) {
        mapa.current.remove();
        mapa.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={contenedor}
      className="gi-leaflet-map"
    />
  );
}

function EditorUbicacion({
  espacio,
  espacios,
  editable,
}: {
  espacio: EspacioMapa;
  espacios: EspacioMapa[];
  editable: boolean;
}) {
  const router = useRouter();

  const [estado, action, pendiente] =
    useActionState(
      guardarUbicacion,
      inicial,
    );

  const [latitud, setLatitud] =
    useState<number | null>(
      espacio.latitud,
    );

  const [longitud, setLongitud] =
    useState<number | null>(
      espacio.longitud,
    );

  const [localidad, setLocalidad] =
    useState(espacio.localidad);

  const [direccion, setDireccion] =
    useState(espacio.direccion);

  const [busqueda, setBusqueda] =
    useState("");

  const [resultados, setResultados] =
    useState<ResultadoBusqueda[]>([]);

  const [buscando, setBuscando] =
    useState(false);

  useEffect(() => {
    setLatitud(espacio.latitud);
    setLongitud(espacio.longitud);
    setLocalidad(espacio.localidad);
    setDireccion(espacio.direccion);
    setResultados([]);
    setBusqueda("");
  }, [espacio]);

  useEffect(() => {
    if (estado.ok) {
      router.refresh();
    }
  }, [estado.ok, router]);

  async function buscar() {
    const consulta =
      busqueda.trim() ||
      [
        espacio.nombre,
        direccion,
        localidad,
        "Olavarría",
        "Buenos Aires",
        "Argentina",
      ]
        .filter(Boolean)
        .join(", ");

    if (consulta.length < 3) return;

    setBuscando(true);
    setResultados([]);

    try {
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q: consulta,
          format: "jsonv2",
          addressdetails: "1",
          limit: "5",
          countrycodes: "ar",
        }).toString();

      const respuesta =
        await fetch(url);

      const datos =
        (await respuesta.json()) as ResultadoBusqueda[];

      setResultados(datos);

// CENTRADO AUTOMATICO BUSQUEDA
if (datos.length > 0) {
  const primero = datos[0];

  const nuevaLat = Number(primero.lat);
  const nuevaLon = Number(primero.lon);

  if (
    Number.isFinite(nuevaLat) &&
    Number.isFinite(nuevaLon)
  ) {
    setLatitud(nuevaLat);
    setLongitud(nuevaLon);

    const calle = [
      primero.address?.road,
      primero.address?.house_number,
    ]
      .filter(Boolean)
      .join(" ");

    const ciudad =
      primero.address?.city ||
      primero.address?.town ||
      primero.address?.village ||
      primero.address?.municipality ||
      "";

    if (calle) setDireccion(calle);
    if (ciudad) setLocalidad(ciudad);
  }
}

      // pequeña pausa para no encadenar consultas
      await new Promise((resolve) =>
        setTimeout(resolve, 1100),
      );
    } finally {
      setBuscando(false);
    }
  }

  function elegir(
    item: ResultadoBusqueda,
  ) {
    const lat = Number(item.lat);
    const lon = Number(item.lon);

    setLatitud(lat);
    setLongitud(lon);

    const calle = [
      item.address?.road,
      item.address?.house_number,
    ]
      .filter(Boolean)
      .join(" ");

    const ciudad =
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.address?.municipality ||
      "";

    if (calle) setDireccion(calle);
    if (ciudad) setLocalidad(ciudad);

    setResultados([]);
  }

  return (
    <div className="gi-map-workspace">
      <section className="gi-map-box">
        <div className="gi-map-toolbar">
          <span>
            <MapPin size={17} />
            <strong>{espacio.nombre}</strong>
          </span>

          <em>
            {latitud !== null &&
            longitud !== null
              ? `${latitud.toFixed(6)}, ${longitud.toFixed(6)}`
              : "Ubicación pendiente"}
          </em>
        </div>

        <MapaLeaflet
          espacios={espacios}
          espacio={espacio}
          latitud={latitud}
          longitud={longitud}
          editable={editable}
          onCambiar={(lat, lon) => {
            setLatitud(lat);
            setLongitud(lon);
          }}
        />

        <div className="gi-map-help">
          {editable
            ? "Hacé clic en el mapa para corregir el punto."
            : "Ubicación registrada."}
        </div>
      </section>

      <aside className="panel gi-map-editor">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">
              Geolocalización
            </span>

            <h2>Ficha territorial</h2>
          </div>

          {espacio.validada ? (
            <span className="gi-location-ok">
              <BadgeCheck size={14} />
              Validada
            </span>
          ) : (
            <span className="gi-location-pending">
              <CircleAlert size={14} />
              Pendiente
            </span>
          )}
        </div>

        {editable ? (
          <>
            <div className="gi-geocode">
              <label>
                <span>
                  Buscar ubicación
                </span>

                <div className="input-wrap">
                  <Search size={16} />

                  <input
                    value={busqueda}
                    onChange={(event) =>
                      setBusqueda(
                        event.target.value,
                      )
                    }
                    placeholder="Calle, número o nombre"
                  />
                </div>
              </label>

              <button
                className="button"
                type="button"
                onClick={buscar}
                disabled={buscando}
              >
                <LocateFixed size={16} />

                {buscando
                  ? "Buscando…"
                  : "Ubicar"}
              </button>
            </div>

            {resultados.length > 0 ? (
              <div className="gi-geocode-results">
                {resultados.map(
                  (item, index) => (
                    <button
                      type="button"
                      key={`${item.lat}-${item.lon}-${index}`}
                      onClick={() =>
                        elegir(item)
                      }
                    >
                      <MapPin size={14} />

                      <span>
                        {item.display_name}
                      </span>
                    </button>
                  ),
                )}
              </div>
            ) : null}

            <form
              action={action}
              className="gi-map-form"
            >
              <input
                type="hidden"
                name="id"
                value={espacio.id}
              />

              <input
                type="hidden"
                name="area_id"
                value={espacio.areaId}
              />

              <input
                type="hidden"
                name="latitude"
                value={latitud ?? ""}
              />

              <input
                type="hidden"
                name="longitude"
                value={longitud ?? ""}
              />

              <label>
                <span>Localidad</span>

                <input
                  name="locality"
                  value={localidad}
                  onChange={(event) =>
                    setLocalidad(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>Dirección</span>

                <input
                  name="address"
                  value={direccion}
                  onChange={(event) =>
                    setDireccion(
                      event.target.value,
                    )
                  }
                />
              </label>

              <div className="gi-coordinates">
                <label>
                  <span>Latitud</span>

                  <input
                    value={latitud ?? ""}
                    onChange={(event) => {
                      const n = Number(
                        event.target.value.replace(
                          ",",
                          ".",
                        ),
                      );

                      setLatitud(
                        Number.isFinite(n)
                          ? n
                          : null,
                      );
                    }}
                  />
                </label>

                <label>
                  <span>Longitud</span>

                  <input
                    value={longitud ?? ""}
                    onChange={(event) => {
                      const n = Number(
                        event.target.value.replace(
                          ",",
                          ".",
                        ),
                      );

                      setLongitud(
                        Number.isFinite(n)
                          ? n
                          : null,
                      );
                    }}
                  />
                </label>
              </div>

              {estado.mensaje ? (
                <span
                  className={
                    estado.ok
                      ? "form-success"
                      : "form-error"
                  }
                >
                  {estado.ok ? (
                    <CheckCircle2
                      size={16}
                    />
                  ) : (
                    <CircleAlert
                      size={16}
                    />
                  )}

                  {estado.mensaje}
                </span>
              ) : null}

              <div className="gi-map-actions">
                <button
                  className="button"
                  type="submit"
                  name="validate_location"
                  value="false"
                  disabled={
                    pendiente ||
                    latitud === null ||
                    longitud === null
                  }
                >
                  <Save size={16} />
                  Guardar
                </button>

                <button
                  className="button primary"
                  type="submit"
                  name="validate_location"
                  value="true"
                  disabled={
                    pendiente ||
                    latitud === null ||
                    longitud === null
                  }
                >
                  <BadgeCheck size={16} />
                  Guardar y validar
                </button>
              </div>
            </form>
          </>
        ) : null}
      </aside>
    </div>
  );
}

export function CulturalMap({
  dependencias,
  espacios,
  editable,
}: {
  dependencias: DependenciaMapa[];
  espacios: EspacioMapa[];
  editable: boolean;
}) {
  const [buscar, setBuscar] =
    useState("");

  const [dependencia, setDependencia] =
    useState("");

  const [estado, setEstado] = useState("todos");

  const [seleccionado, setSeleccionado] =
    useState(
      espacios[0]?.id ?? "",
    );

  const texto =
    useDeferredValue(
      buscar
        .trim()
        .toLocaleLowerCase("es"),
    );

  const filtrados = useMemo(() => {
    return espacios.filter((item) => {
      if (
        dependencia &&
        item.areaSlug !== dependencia
      )
        return false;

      if (
        estado === "pendientes" &&
        item.validada
      )
        return false;

      if (
        estado === "validados" &&
        !item.validada
      )
        return false;

      if (
        texto &&
        ![
          item.nombre,
          item.areaNombre,
          item.localidad,
          item.direccion,
        ]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(texto)
      )
        return false;

      return true;
    });
  }, [
    espacios,
    dependencia,
    estado,
    texto,
  ]);

  useEffect(() => {
    if (
      !filtrados.some(
        (item) =>
          item.id === seleccionado,
      )
    ) {
      setSeleccionado(
        filtrados[0]?.id ?? "",
      );
    }
  }, [
    filtrados,
    seleccionado,
  ]);

  const actual =
    filtrados.find(
      (item) =>
        item.id === seleccionado,
    ) ?? null;

  const conCoordenadas =
    espacios.filter(
      (item) =>
        item.latitud !== null &&
        item.longitud !== null,
    ).length;

  const validados =
    espacios.filter(
      (item) => item.validada,
    ).length;

  return (
    <div className="gi-map-stage">
      <section className="panel gi-map-stats">
        <div>
          <strong>
            {espacios.length}
          </strong>
          <span>espacios</span>
        </div>

        <div>
          <strong>
            {conCoordenadas}
          </strong>
          <span>con coordenadas</span>
        </div>

        <div>
          <strong>{validados}</strong>
          <span>validados</span>
        </div>

        <div>
          <strong>
            {espacios.length -
              validados}
          </strong>
          <span>pendientes</span>
        </div>
      </section>

      <div className="gi-map-layout">
        <aside className="panel gi-map-list-panel">
          <div className="filter-title">
            <Filter size={18} />
            <strong>
              Espacios culturales
            </strong>
          </div>

          <div className="input-wrap">
            <Search size={16} />

            <input
              value={buscar}
              onChange={(event) =>
                setBuscar(
                  event.target.value,
                )
              }
              placeholder="Buscar espacio"
            />
          </div>

          <select
            value={dependencia}
            onChange={(event) =>
              setDependencia(
                event.target.value,
              )
            }
          >
            <option value="">
              Todas las dependencias
            </option>

            {dependencias.map(
              (item) => (
                <option
                  key={item.slug}
                  value={item.slug}
                >
                  {item.nombre}
                </option>
              ),
            )}
          </select>

          <select
            value={estado}
            onChange={(event) =>
              setEstado(
                event.target.value,
              )
            }
          >
            <option value="pendientes">
              Pendientes
            </option>

            <option value="todos">
              Todos
            </option>

            <option value="validados">
              Validados
            </option>
          </select>

          <div className="gi-map-space-list">
            {filtrados.map(
              (item) => (
                <button
                  type="button"
                  key={item.id}
                  className={
                    item.id ===
                    seleccionado
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setSeleccionado(
                      item.id,
                    )
                  }
                >
                  <Building2
                    size={16}
                  />

                  <span>
                    <strong>
                      {item.nombre}
                    </strong>

                    <small>
                      {item.areaNombre}
                    </small>
                  </span>

                  {item.validada ? (
                    <BadgeCheck
                      size={16}
                    />
                  ) : (
                    <MapPin
                      size={16}
                    />
                  )}
                </button>
              ),
            )}
          </div>
        </aside>

        <main>
          {actual ? (
            <EditorUbicacion
              key={actual.id}
              espacio={actual}
              espacios={espacios}
              editable={editable}
            />
          ) : (
            <section className="panel gi-map-no-results">
              No hay espacios con estos filtros.
            </section>
          )}
        </main>
      </div>
    </div>
  );
}