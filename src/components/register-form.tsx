"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Save,
} from "lucide-react";

import {
  registrarEntrada,
  type RegistrarEstado,
} from "@/app/(plataforma)/registrar/actions";


type AreaFormulario = {
  id: string;
  nombre: string;
  espacios:
    Array<{
      id: string;
      nombre: string;
    }>;
};


const estadoInicial:
RegistrarEstado = {
  ok: false,
  mensaje: "",
};


export function RegisterForm({
  areas,
  tipoInicial = "",
  areaInicial = "",
  spaceInicial = "",
}: {
  areas: AreaFormulario[];
  tipoInicial?: string;
  areaInicial?: string;
  spaceInicial?: string;
}) {

  const [
    estado,
    formAction,
    pendiente,
  ] =
    useActionState(
      registrarEntrada,
      estadoInicial,
    );


  const [
    areaSeleccionada,
    setAreaSeleccionada,
  ] =
    useState(
      areaInicial,
    );


  const [
    spaceSeleccionado,
    setSpaceSeleccionado,
  ] =
    useState(
      spaceInicial,
    );


  const [
    tipoSeleccionado,
    setTipoSeleccionado,
  ] =
    useState(
      tipoInicial,
    );


  const espacios =
    areas.find(
      (area) =>
        area.id ===
        areaSeleccionada,
    )?.espacios ?? [];


  const esAgenda =
    tipoSeleccionado ===
      "evento" ||
    tipoSeleccionado ===
      "reunion";


  const esEvento =
    tipoSeleccionado ===
    "evento";


  const esRegistro =
    tipoSeleccionado ===
      "nota" ||
    tipoSeleccionado ===
      "actualizacion";


  return (
    <form
      className="register-form panel"
      action={formAction}
    >

      <div className="form-banner">

        <strong>
          Carga activa
        </strong>

        <span>
          La información se guarda directamente en la base institucional.
        </span>

      </div>


      <div className="form-grid">

        <label>

          <span>
            Tipo de registro
          </span>

          <select
            name="kind"
            required
            value={tipoSeleccionado}
            onChange={
              (event) =>
                setTipoSeleccionado(
                  event.target.value,
                )
            }
          >

            <option
              value=""
              disabled
            >
              Seleccionar
            </option>

            <option value="evento">
              Actividad o evento
            </option>

            <option value="solicitud">
              Solicitud
            </option>

            <option value="reunion">
              Reunión
            </option>

            <option value="nota">
              Nota institucional
            </option>

            <option value="actualizacion">
              Actualización de información
            </option>

          </select>

        </label>


        <label>

          <span>
            Dependencia responsable
          </span>

          <select
            name="area_id"
            required
            value={areaSeleccionada}
            onChange={
              (event) => {
                setAreaSeleccionada(
                  event.target.value,
                );

                setSpaceSeleccionado(
                  "",
                );
              }
            }
          >

            <option
              value=""
              disabled
            >
              Seleccionar dependencia
            </option>

            {
              areas.map(
                (area) => (
                  <option
                    value={area.id}
                    key={area.id}
                  >
                    {area.nombre}
                  </option>
                ),
              )
            }

          </select>

        </label>


        <label>

          <span>
            Espacio específico
          </span>

          <select
            name="space_id"
            value={spaceSeleccionado}
            disabled={
              !areaSeleccionada
            }
            onChange={
              (event) =>
                setSpaceSeleccionado(
                  event.target.value,
                )
            }
          >

            <option value="">
              Toda la dependencia / seleccionar
            </option>

            {
              espacios.map(
                (espacio) => (
                  <option
                    value={espacio.id}
                    key={espacio.id}
                  >
                    {espacio.nombre}
                  </option>
                ),
              )
            }

          </select>

        </label>


        {
          esEvento
            ? (
              <label>

                <span>
                  Clase de actividad
                </span>

                <select
                  name="agenda_category"
                  defaultValue="evento"
                >
                  <option value="evento">
                    Evento / espectáculo
                  </option>

                  <option value="taller">
                    Taller
                  </option>

                  <option value="propuesta_educativa">
                    Propuesta educativa
                  </option>

                  <option value="otro">
                    Otra actividad
                  </option>
                </select>

              </label>
            )
            : null
        }


        {
          tipoSeleccionado ===
            "reunion"
            ? (
              <input
                type="hidden"
                name="agenda_category"
                value="reunion"
              />
            )
            : null
        }


        {
          esAgenda
            ? (
              <>

                <label>

                  <span>
                    Inicio
                  </span>

                  <div className="input-wrap">
                    <CalendarDays size={17} />

                    <input
                      name="starts_at"
                      type="datetime-local"
                      required
                    />
                  </div>

                </label>


                <label>

                  <span>
                    Finalización opcional
                  </span>

                  <div className="input-wrap">
                    <CalendarDays size={17} />

                    <input
                      name="ends_at"
                      type="datetime-local"
                    />
                  </div>

                </label>

              </>
            )
            : (
              <label>

                <span>
                  {
                    esRegistro
                      ? "Fecha del registro"
                      : "Fecha o vencimiento"
                  }
                </span>

                <div className="input-wrap">
                  <CalendarDays size={17} />

                  <input
                    name="due_date"
                    type="date"
                  />
                </div>

              </label>
            )
        }


        <label className="wide">

          <span>
            Título
          </span>

          <input
            name="title"
            required
            minLength={3}
            placeholder="Nombre claro de la actividad o registro"
          />

        </label>


        <label>

          <span>
            Prioridad
          </span>

          <select
            name="priority"
            defaultValue="normal"
          >
            <option value="normal">
              Normal
            </option>

            <option value="alta">
              Alta
            </option>

            <option value="compromiso_prioritario">
              Compromiso prioritario
            </option>
          </select>

        </label>


        <label className="wide">

          <span>
            Detalle
          </span>

          <textarea
            name="details"
            required
            minLength={3}
            rows={6}
            placeholder="Información, responsables, necesidades y observaciones"
          />

        </label>

      </div>


      <div className="form-actions">

        {
          estado.mensaje
            ? (
              <span
                className={
                  estado.ok
                    ? "form-success"
                    : "form-error"
                }
              >

                {
                  estado.ok
                    ? <CheckCircle2 size={18} />
                    : <CircleAlert size={18} />
                }

                {" "}
                {estado.mensaje}

              </span>
            )
            : (
              <span>
                Tipo, dependencia, título y detalle son obligatorios.
              </span>
            )
        }


        <button
          className="button primary"
          type="submit"
          disabled={pendiente}
        >

          <Save size={18} />

          {
            pendiente
              ? "Guardando…"
              : "Guardar registro"
          }

        </button>

      </div>

    </form>
  );
}