"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Plus,
  Save,
  Search,
  UserRound,
  UserRoundMinus,
  Users,
} from "lucide-react";
import {
  crearAsignacion,
  crearPersonal,
  darDeBajaPersonal,
  desactivarAsignacion,
  editarAsignacion,
  editarPersonal,
  type PersonalEstadoAccion,
} from "@/app/(plataforma)/personal/actions";
import type {
  AsignacionPersonal,
  EstadoPersonal,
  PersonalCultural,
} from "@/lib/staff-data";

export type AreaPersonalOption = {
  id: string;
  nombre: string;
  slug: string;
  espacios: Array<{ id: string; nombre: string }>;
};

const inicial: PersonalEstadoAccion = { ok: false, mensaje: "" };

const etiquetasEstado: Record<EstadoPersonal, string> = {
  activo: "Activo",
  licencia: "Licencia",
  baja: "Baja",
  a_confirmar: "A confirmar",
};

function Mensaje({ estado }: { estado: PersonalEstadoAccion }) {
  if (!estado.mensaje) return null;

  return (
    <span className={estado.ok ? "form-success" : "form-error"}>
      {estado.ok ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
      {estado.mensaje}
    </span>
  );
}

function nombreArea(areaId: string | null, areas: AreaPersonalOption[]) {
  if (!areaId) return "Equipo central de Subsecretaría";
  return areas.find((item) => item.id === areaId)?.nombre || "Dependencia sin identificar";
}

function nombreEspacio(
  areaId: string | null,
  spaceId: string | null,
  areas: AreaPersonalOption[],
) {
  if (!areaId || !spaceId) return "";
  return areas
    .find((item) => item.id === areaId)
    ?.espacios.find((item) => item.id === spaceId)?.nombre || "";
}

function CamposUbicacion({
  areas,
  areaInicial,
  spaceInicial,
  canManageCentral,
}: {
  areas: AreaPersonalOption[];
  areaInicial: string | null;
  spaceInicial: string | null;
  canManageCentral: boolean;
}) {
  const [areaId, setAreaId] = useState(areaInicial ?? "");
  const area = areas.find((item) => item.id === areaId);

  return (
    <>
      <label>
        <span>Dependencia</span>
        <select
          name="area_id"
          value={areaId}
          onChange={(event) => setAreaId(event.target.value)}
          required={!canManageCentral}
        >
          {canManageCentral ? (
            <option value="">Equipo central de Subsecretaría</option>
          ) : null}
          {areas.map((item) => (
            <option key={item.id} value={item.id}>{item.nombre}</option>
          ))}
        </select>
      </label>

      <label>
        <span>Espacio</span>
        <select
          name="space_id"
          key={`${areaId}-${spaceInicial ?? "central"}`}
          defaultValue={areaId === areaInicial ? spaceInicial ?? "" : ""}
          disabled={!areaId}
        >
          <option value="">Sin espacio específico</option>
          {(area?.espacios ?? []).map((espacio) => (
            <option key={espacio.id} value={espacio.id}>{espacio.nombre}</option>
          ))}
        </select>
      </label>
    </>
  );
}

function CamposAdministrativos({
  persona,
}: {
  persona?: PersonalCultural;
}) {
  return (
    <>
      <label>
        <span>Legajo</span>
        <input
          name="employee_number"
          defaultValue={persona?.legajo ?? ""}
          placeholder="Legajo o tipo de vinculación"
        />
      </label>

      <label>
        <span>Estado</span>
        <select name="status" defaultValue={persona?.estado ?? "activo"}>
          <option value="activo">Activo</option>
          <option value="licencia">Licencia</option>
          <option value="a_confirmar">A confirmar</option>
          <option value="baja">Baja</option>
        </select>
      </label>

      <label>
        <span>Año de ingreso</span>
        <input
          name="start_year"
          inputMode="numeric"
          defaultValue={persona?.anioIngreso ?? ""}
          placeholder="Ej.: 2016"
        />
      </label>

      <label>
        <span>Categoría</span>
        <input
          name="category"
          defaultValue={persona?.categoria ?? ""}
          placeholder="Categoría"
        />
      </label>

      <label>
        <span>Tipo de vínculo</span>
        <input
          name="employment_type"
          defaultValue={persona?.tipoVinculo ?? ""}
          placeholder="Planta, jornalizado, contrato…"
        />
      </label>

      <label>
        <span>Régimen / horas</span>
        <input
          name="weekly_hours"
          defaultValue={persona?.horas ?? ""}
          placeholder="Ej.: 30 hs"
        />
      </label>

      <label>
        <span>Vencimiento</span>
        <input
          name="contract_expires"
          type="date"
          defaultValue={persona?.vencimiento ?? ""}
        />
      </label>
    </>
  );
}

function CamposPersonal({
  areas,
  persona,
  areaInicial,
  canManageCentral,
}: {
  areas: AreaPersonalOption[];
  persona?: PersonalCultural;
  areaInicial: string | null;
  canManageCentral: boolean;
}) {
  return (
    <>
      <label>
        <span>Nombre y apellido</span>
        <input
          name="full_name"
          required
          minLength={2}
          defaultValue={persona?.nombre ?? ""}
          placeholder="Nombre completo"
        />
      </label>

      <CamposAdministrativos persona={persona} />

      <CamposUbicacion
        areas={areas}
        areaInicial={persona?.areaId ?? areaInicial}
        spaceInicial={persona?.spaceId ?? null}
        canManageCentral={canManageCentral}
      />

      <label>
        <span>Rol / cargo principal</span>
        <input
          name="role_title"
          defaultValue={persona?.rol ?? ""}
          placeholder="Encargado, docente, administrativo…"
        />
      </label>

      <label className="wide">
        <span>Tareas / función principal</span>
        <textarea
          name="tasks"
          rows={3}
          defaultValue={persona?.tareas ?? ""}
          placeholder="Funciones principales"
        />
      </label>

      <label className="wide">
        <span>Observaciones de gestión</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={persona?.observaciones ?? ""}
          placeholder="Información operativa relevante"
        />
      </label>
    </>
  );
}

function CrearPersonalForm({
  areas,
  areaInicial,
  canManageCentral,
}: {
  areas: AreaPersonalOption[];
  areaInicial: string | null;
  canManageCentral: boolean;
}) {
  const [estado, action, pendiente] = useActionState(crearPersonal, inicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado.ok]);

  return (
    <details className="panel staff-create">
      <summary>
        <span className="heading-icon small"><Plus size={19} /></span>
        <span>
          <strong>Agregar personal</strong>
          <small>Alta de una persona y su primera asignación institucional.</small>
        </span>
        <ChevronDown size={19} />
      </summary>

      <form ref={formRef} action={action} className="structure-form staff-form stage14-form">
        <CamposPersonal
          areas={areas}
          areaInicial={areaInicial}
          canManageCentral={canManageCentral}
        />
        <div className="structure-form-actions wide">
          <Mensaje estado={estado} />
          <button className="button primary" type="submit" disabled={pendiente}>
            <Save size={16} />
            {pendiente ? "Guardando…" : "Agregar persona"}
          </button>
        </div>
      </form>
    </details>
  );
}

function AssignmentFields({
  asignacion,
  areas,
  canManageCentral,
}: {
  asignacion?: AsignacionPersonal;
  areas: AreaPersonalOption[];
  canManageCentral: boolean;
}) {
  return (
    <>
      <CamposUbicacion
        areas={areas}
        areaInicial={asignacion?.areaId ?? (canManageCentral ? null : areas[0]?.id ?? null)}
        spaceInicial={asignacion?.spaceId ?? null}
        canManageCentral={canManageCentral}
      />

      <label>
        <span>Rol / cargo</span>
        <input
          name="role_title"
          defaultValue={asignacion?.rol ?? ""}
          placeholder="Rol en esta asignación"
        />
      </label>

      <label>
        <span>Régimen / horas</span>
        <input
          name="weekly_hours"
          defaultValue={asignacion?.horas ?? ""}
          placeholder="Ej.: 6 hs"
        />
      </label>

      <label>
        <span>Tipo de vínculo</span>
        <input
          name="employment_type"
          defaultValue={asignacion?.tipoVinculo ?? ""}
          placeholder="Planta, jornalizado…"
        />
      </label>

      <label>
        <span>Año de ingreso</span>
        <input
          name="start_year"
          inputMode="numeric"
          defaultValue={asignacion?.anioIngreso ?? ""}
          placeholder="Ej.: 2022"
        />
      </label>

      <label>
        <span>Categoría</span>
        <input
          name="category"
          defaultValue={asignacion?.categoria ?? ""}
          placeholder="Categoría"
        />
      </label>

      <label>
        <span>Vencimiento</span>
        <input
          name="contract_expires"
          type="date"
          defaultValue={asignacion?.vencimiento ?? ""}
        />
      </label>

      <label className="wide">
        <span>Tareas específicas</span>
        <textarea
          name="tasks"
          rows={2}
          defaultValue={asignacion?.tareas ?? ""}
          placeholder="Funciones en esta asignación"
        />
      </label>

      <label className="wide">
        <span>Observaciones</span>
        <textarea
          name="notes"
          rows={2}
          defaultValue={asignacion?.observaciones ?? ""}
          placeholder="Observaciones de esta asignación"
        />
      </label>
    </>
  );
}

function AssignmentEditor({
  asignacion,
  areas,
  canManageCentral,
}: {
  asignacion: AsignacionPersonal;
  areas: AreaPersonalOption[];
  canManageCentral: boolean;
}) {
  const [estado, action, pendiente] = useActionState(editarAsignacion, inicial);
  const [estadoArchivo, actionArchivo, archivando] = useActionState(desactivarAsignacion, inicial);

  const area = nombreArea(asignacion.areaId, areas);
  const espacio =
    nombreEspacio(asignacion.areaId, asignacion.spaceId, areas) ||
    asignacion.espacioFuente ||
    "Sin espacio específico";

  return (
    <details className={`assignment-card ${asignacion.activa ? "" : "is-inactive"}`}>
      <summary>
        <span className="assignment-icon"><BriefcaseBusiness size={16} /></span>
        <span>
          <strong>{area}</strong>
          <small>{espacio}</small>
        </span>
        <span className="assignment-role">
          {asignacion.rol || "Rol a completar"}
          {asignacion.horas ? <em>{asignacion.horas}</em> : null}
        </span>
        <ChevronDown size={17} />
      </summary>

      <div className="assignment-body">
        {asignacion.areaFuente || asignacion.espacioFuente ? (
          <div className="source-strip">
            <ClipboardList size={16} />
            <span>
              Fuente del padrón:
              {" "}
              <strong>
                {[asignacion.areaFuente, asignacion.espacioFuente].filter(Boolean).join(" · ")}
              </strong>
              {asignacion.vencimientoFuente ? ` · Vencimiento informado: ${asignacion.vencimientoFuente}` : ""}
            </span>
          </div>
        ) : null}

        <form action={action} className="structure-form staff-form stage14-form">
          <input type="hidden" name="assignment_id" value={asignacion.id} />
          <AssignmentFields
            asignacion={asignacion}
            areas={areas}
            canManageCentral={canManageCentral}
          />
          <div className="structure-form-actions wide">
            <Mensaje estado={estado} />
            <button className="button" type="submit" disabled={pendiente}>
              <Save size={16} />
              {pendiente ? "Guardando…" : "Guardar asignación"}
            </button>
          </div>
        </form>

        {asignacion.activa ? (
          <form
            action={actionArchivo}
            className="assignment-archive"
            onSubmit={(event) => {
              if (!window.confirm("¿Archivar esta asignación? La persona no será eliminada.")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="assignment_id" value={asignacion.id} />
            <Mensaje estado={estadoArchivo} />
            <button className="button danger subtle-danger" type="submit" disabled={archivando}>
              {archivando ? "Archivando…" : "Archivar asignación"}
            </button>
          </form>
        ) : (
          <span className="assignment-inactive-label">Asignación archivada</span>
        )}
      </div>
    </details>
  );
}

function AddAssignment({
  persona,
  areas,
  canManageCentral,
}: {
  persona: PersonalCultural;
  areas: AreaPersonalOption[];
  canManageCentral: boolean;
}) {
  const [estado, action, pendiente] = useActionState(crearAsignacion, inicial);

  return (
    <details className="assignment-add">
      <summary>
        <Plus size={15} />
        Nueva asignación
      </summary>
      <form action={action} className="structure-form staff-form stage14-form">
        <input type="hidden" name="staff_id" value={persona.id} />
        <AssignmentFields
          areas={areas}
          canManageCentral={canManageCentral}
        />
        <div className="structure-form-actions wide">
          <Mensaje estado={estado} />
          <button className="button primary" type="submit" disabled={pendiente}>
            <Plus size={16} />
            {pendiente ? "Guardando…" : "Agregar asignación"}
          </button>
        </div>
      </form>
    </details>
  );
}

function EditorPersonal({
  persona,
  areas,
  editable,
  canManageCentral,
}: {
  persona: PersonalCultural;
  areas: AreaPersonalOption[];
  editable: boolean;
  canManageCentral: boolean;
}) {
  const [estadoEdicion, actionEditar, editando] = useActionState(editarPersonal, inicial);
  const [estadoBaja, actionBaja, dandoBaja] = useActionState(darDeBajaPersonal, inicial);

  const principalArea = nombreArea(persona.areaId, areas);
  const principalEspacio =
    nombreEspacio(persona.areaId, persona.spaceId, areas) ||
    persona.espacioFuente ||
    "Sin espacio específico";
  const asignacionesActivas = persona.asignaciones.filter((item) => item.activa);
  const inicialNombre = persona.nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <details className={`staff-card staff-status-${persona.estado}`}>
      <summary>
        <span className="staff-avatar">{inicialNombre || <UserRound size={18} />}</span>
        <span className="staff-title">
          <strong>{persona.nombre}</strong>
          <small>{persona.rol || "Rol a completar"} · {principalArea}</small>
        </span>
        <span className="staff-summary-meta">
          {persona.legajo ? <em>Legajo {persona.legajo}</em> : null}
          <em>{asignacionesActivas.length} {asignacionesActivas.length === 1 ? "asignación" : "asignaciones"}</em>
          <b>{etiquetasEstado[persona.estado]}</b>
        </span>
        <ChevronDown className="staff-chevron" size={18} />
      </summary>

      <div className="staff-card-body">
        <div className="staff-section-title">
          <div>
            <span className="eyebrow">Ficha institucional</span>
            <h3>Datos principales</h3>
          </div>
          <span>{principalEspacio}</span>
        </div>

        {editable ? (
          <form action={actionEditar} className="structure-form staff-form stage14-form">
            <input type="hidden" name="id" value={persona.id} />
            <CamposPersonal
              areas={areas}
              persona={persona}
              areaInicial={persona.areaId}
              canManageCentral={canManageCentral}
            />
            <div className="structure-form-actions wide">
              <Mensaje estado={estadoEdicion} />
              <button className="button" type="submit" disabled={editando}>
                <Save size={16} />
                {editando ? "Guardando…" : "Guardar ficha"}
              </button>
            </div>
          </form>
        ) : null}

        <section className="assignments-section">
          <div className="staff-section-title">
            <div>
              <span className="eyebrow">Organización real</span>
              <h3>Asignaciones</h3>
            </div>
            <span>{asignacionesActivas.length} activas</span>
          </div>

          <div className="assignment-list">
            {persona.asignaciones.length === 0 ? (
              <div className="staff-empty-row">Todavía no hay asignaciones cargadas.</div>
            ) : (
              persona.asignaciones.map((asignacion) => (
                <AssignmentEditor
                  key={asignacion.id}
                  asignacion={asignacion}
                  areas={areas}
                  canManageCentral={canManageCentral}
                />
              ))
            )}
          </div>

          {editable ? (
            <AddAssignment
              persona={persona}
              areas={areas}
              canManageCentral={canManageCentral}
            />
          ) : null}
        </section>

        {editable && persona.estado !== "baja" ? (
          <div className="staff-low-row">
            <div>
              <strong>Dar de baja a la persona</strong>
              <span>La ficha y sus asignaciones quedan conservadas en el historial.</span>
            </div>
            <form
              action={actionBaja}
              onSubmit={(event) => {
                if (!window.confirm(`¿Registrar la baja de ${persona.nombre}?`)) event.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={persona.id} />
              <button className="button danger" type="submit" disabled={dandoBaja}>
                <UserRoundMinus size={16} />
                {dandoBaja ? "Guardando…" : "Dar de baja"}
              </button>
            </form>
          </div>
        ) : null}
        <Mensaje estado={estadoBaja} />
      </div>
    </details>
  );
}

export function StaffManager({
  personas,
  areas,
  editable,
  canManageCentral,
  initialAreaId = "",
}: {
  personas: PersonalCultural[];
  areas: AreaPersonalOption[];
  editable: boolean;
  canManageCentral: boolean;
  initialAreaId?: string;
}) {
  const [consulta, setConsulta] = useState("");
  const [areaSeleccionada, setAreaSeleccionada] = useState(initialAreaId || "todas");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("todos");

  const personasFiltradas = useMemo(() => {
    const texto = consulta.trim().toLocaleLowerCase("es");

    return personas.filter((persona) => {
      if (areaSeleccionada === "central") {
        const central =
          persona.areaId === null ||
          persona.asignaciones.some((asignacion) => asignacion.areaId === null && asignacion.activa);
        if (!central) return false;
      } else if (areaSeleccionada !== "todas") {
        const pertenece =
          persona.areaId === areaSeleccionada ||
          persona.asignaciones.some(
            (asignacion) => asignacion.areaId === areaSeleccionada && asignacion.activa,
          );
        if (!pertenece) return false;
      }

      if (estadoSeleccionado === "vigentes" && persona.estado === "baja") return false;
      if (
        estadoSeleccionado !== "todos" &&
        estadoSeleccionado !== "vigentes" &&
        persona.estado !== estadoSeleccionado
      ) return false;

      if (!texto) return true;

      const asignaciones = persona.asignaciones
        .map((asignacion) => [
          asignacion.rol,
          asignacion.tareas,
          asignacion.areaFuente,
          asignacion.espacioFuente,
          nombreArea(asignacion.areaId, areas),
          nombreEspacio(asignacion.areaId, asignacion.spaceId, areas),
        ].join(" "))
        .join(" ");

      return [
        persona.nombre,
        persona.legajo,
        persona.rol,
        persona.tareas,
        persona.areaFuente,
        persona.espacioFuente,
        nombreArea(persona.areaId, areas),
        nombreEspacio(persona.areaId, persona.spaceId, areas),
        asignaciones,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(texto);
    });
  }, [personas, areas, consulta, areaSeleccionada, estadoSeleccionado]);

  const areaAlta =
    areaSeleccionada === "central"
      ? null
      : areaSeleccionada !== "todas" && areas.some((item) => item.id === areaSeleccionada)
        ? areaSeleccionada
        : canManageCentral
          ? null
          : areas[0]?.id ?? null;

  return (
    <div className="page-stack">
      {editable ? (
        <CrearPersonalForm
          areas={areas}
          areaInicial={areaAlta}
          canManageCentral={canManageCentral}
        />
      ) : null}

      <section className="panel staff-directory">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Padrón institucional completo</span>
            <h2>Personal cargado</h2>
          </div>
          <span className="space-count">{personasFiltradas.length} visibles</span>
        </div>

        <div className="staff-total-strip">
          <div>
            <strong>{personas.length}</strong>
            <span>personas en la base</span>
          </div>
          <div>
            <strong>{personas.reduce((total, persona) => total + persona.asignaciones.length, 0)}</strong>
            <span>asignaciones cargadas</span>
          </div>
          <button
            className="button"
            type="button"
            onClick={() => {
              setConsulta("");
              setAreaSeleccionada("todas");
              setEstadoSeleccionado("todos");
            }}
          >
            Mostrar todo el padrón
          </button>
        </div>

        <div className="staff-filters">
          <label className="staff-search">
            <Search size={17} />
            <input
              value={consulta}
              onChange={(event) => setConsulta(event.target.value)}
              placeholder="Buscar por nombre, legajo, rol, escuela o espacio"
            />
          </label>

          <select
            value={areaSeleccionada}
            onChange={(event) => setAreaSeleccionada(event.target.value)}
          >
            <option value="todas">Todas las dependencias</option>
            {canManageCentral ? <option value="central">Equipo central de Subsecretaría</option> : null}
            {areas.map((area) => (
              <option key={area.id} value={area.id}>{area.nombre}</option>
            ))}
          </select>

          <select
            value={estadoSeleccionado}
            onChange={(event) => setEstadoSeleccionado(event.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="vigentes">Vigentes</option>
            <option value="activo">Activos</option>
            <option value="licencia">Licencia</option>
            <option value="a_confirmar">A confirmar</option>
            <option value="baja">Bajas</option>
          </select>
        </div>

        {personasFiltradas.length === 0 ? (
          <div className="inline-empty compact-empty">
            <Users size={30} />
            <strong>No hay personal con estos filtros</strong>
            <span>Podés cambiar la búsqueda o agregar una nueva persona.</span>
          </div>
        ) : (
          <div className="staff-list">
            {personasFiltradas.map((persona) => (
              <EditorPersonal
                key={persona.id}
                persona={persona}
                areas={areas}
                editable={editable}
                canManageCentral={canManageCentral}
              />
            ))}
          </div>
        )}
      </section>

      <div className="data-note">
        <BadgeCheck size={20} />
        <span>
          El padrón puede conservar varias asignaciones por persona. Dar de baja o archivar una asignación no borra el historial.
        </span>
      </div>
    </div>
  );
}