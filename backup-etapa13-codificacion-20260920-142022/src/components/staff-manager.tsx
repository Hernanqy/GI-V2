"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Plus,
  Save,
  Search,
  UserRound,
  UserRoundMinus,
  Users,
} from "lucide-react";
import {
  crearPersonal,
  darDeBajaPersonal,
  editarPersonal,
  type PersonalEstadoAccion,
} from "@/app/(plataforma)/personal/actions";
import type { EstadoPersonal, PersonalCultural } from "@/lib/staff-data";

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

function CamposPersonal({
  areas,
  areaInicial,
  persona,
}: {
  areas: AreaPersonalOption[];
  areaInicial: string;
  persona?: PersonalCultural;
}) {
  const [areaId, setAreaId] = useState(persona?.areaId || areaInicial);
  const area = areas.find((item) => item.id === areaId) ?? areas[0];

  useEffect(() => {
    if (!areaId && areas[0]) setAreaId(areas[0].id);
  }, [areaId, areas]);

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

      <label>
        <span>Legajo</span>
        <input
          name="employee_number"
          defaultValue={persona?.legajo ?? ""}
          placeholder="Legajo o tipo de vinculaciÃ³n"
        />
      </label>

      <label>
        <span>Dependencia</span>
        <select
          name="area_id"
          value={area?.id ?? ""}
          onChange={(event) => setAreaId(event.target.value)}
          required
        >
          {areas.map((item) => (
            <option key={item.id} value={item.id}>{item.nombre}</option>
          ))}
        </select>
      </label>

      <label>
        <span>Espacio</span>
        <select
          name="space_id"
          key={`${area?.id}-${persona?.spaceId ?? "central"}`}
          defaultValue={persona?.areaId === area?.id ? persona?.spaceId ?? "" : ""}
        >
          <option value="">Equipo central / sin espacio especÃ­fico</option>
          {(area?.espacios ?? []).map((espacio) => (
            <option key={espacio.id} value={espacio.id}>{espacio.nombre}</option>
          ))}
        </select>
      </label>

      <label>
        <span>Rol / cargo</span>
        <input
          name="role_title"
          defaultValue={persona?.rol ?? ""}
          placeholder="Encargado, docente, administrativoâ€¦"
        />
      </label>

      <label>
        <span>Tipo de vÃ­nculo</span>
        <input
          name="employment_type"
          defaultValue={persona?.tipoVinculo ?? ""}
          placeholder="Planta, jornalizado, beca, contratoâ€¦"
        />
      </label>

      <label>
        <span>RÃ©gimen / horas</span>
        <input
          name="weekly_hours"
          defaultValue={persona?.horas ?? ""}
          placeholder="Ej.: 30 hs"
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

      <label className="wide">
        <span>Tareas / funciÃ³n</span>
        <textarea
          name="tasks"
          rows={3}
          defaultValue={persona?.tareas ?? ""}
          placeholder="Funciones principales dentro del espacio"
        />
      </label>

      <label className="wide">
        <span>Observaciones de gestiÃ³n</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={persona?.observaciones ?? ""}
          placeholder="InformaciÃ³n operativa relevante"
        />
      </label>
    </>
  );
}

function CrearPersonalForm({
  areas,
  areaInicial,
}: {
  areas: AreaPersonalOption[];
  areaInicial: string;
}) {
  const [estado, action, pendiente] = useActionState(crearPersonal, inicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado.ok]);

  if (areas.length === 0) return null;

  return (
    <details className="panel staff-create">
      <summary>
        <span className="heading-icon small"><Plus size={19} /></span>
        <span>
          <strong>Agregar personal</strong>
          <small>Alta operativa vinculada a una dependencia y, si corresponde, a un espacio.</small>
        </span>
        <ChevronDown size={19} />
      </summary>
      <form ref={formRef} action={action} className="structure-form staff-form">
        <CamposPersonal areas={areas} areaInicial={areaInicial || areas[0].id} />
        <div className="structure-form-actions wide">
          <Mensaje estado={estado} />
          <button className="button primary" type="submit" disabled={pendiente}>
            <Save size={16} />
            {pendiente ? "Guardandoâ€¦" : "Agregar persona"}
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
}: {
  persona: PersonalCultural;
  areas: AreaPersonalOption[];
  editable: boolean;
}) {
  const [estadoEdicion, actionEditar, editando] = useActionState(editarPersonal, inicial);
  const [estadoBaja, actionBaja, dandoBaja] = useActionState(darDeBajaPersonal, inicial);
  const area = areas.find((item) => item.id === persona.areaId);
  const espacio = area?.espacios.find((item) => item.id === persona.spaceId);
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
          <small>{persona.rol || "Rol a completar"} Â· {espacio?.nombre || "Equipo central"}</small>
        </span>
        <span className="staff-summary-meta">
          {persona.legajo ? <em>Legajo {persona.legajo}</em> : null}
          <b>{etiquetasEstado[persona.estado]}</b>
        </span>
        <ChevronDown className="staff-chevron" size={18} />
      </summary>

      <div className="staff-card-body">
        {editable ? (
          <>
            <form action={actionEditar} className="structure-form staff-form">
              <input type="hidden" name="id" value={persona.id} />
              <CamposPersonal areas={areas} areaInicial={persona.areaId} persona={persona} />
              <div className="structure-form-actions wide">
                <Mensaje estado={estadoEdicion} />
                <button className="button" type="submit" disabled={editando}>
                  <Save size={16} />
                  {editando ? "Guardandoâ€¦" : "Guardar ficha"}
                </button>
              </div>
            </form>

            {persona.estado !== "baja" ? (
              <div className="staff-low-row">
                <div>
                  <strong>Dar de baja</strong>
                  <span>No elimina la ficha: conserva la persona en el historial institucional.</span>
                </div>
                <form
                  action={actionBaja}
                  onSubmit={(event) => {
                    if (!window.confirm(`Â¿Registrar la baja de ${persona.nombre}?`)) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={persona.id} />
                  <input type="hidden" name="area_id" value={persona.areaId} />
                  <button className="button danger" type="submit" disabled={dandoBaja}>
                    <UserRoundMinus size={16} />
                    {dandoBaja ? "Guardandoâ€¦" : "Dar de baja"}
                  </button>
                </form>
              </div>
            ) : null}
            <Mensaje estado={estadoBaja} />
          </>
        ) : (
          <div className="staff-readonly">
            <div><strong>Dependencia</strong><span>{area?.nombre || "Sin dependencia"}</span></div>
            <div><strong>Espacio</strong><span>{espacio?.nombre || "Equipo central"}</span></div>
            <div><strong>Legajo</strong><span>{persona.legajo || "Sin dato"}</span></div>
            <div><strong>Rol</strong><span>{persona.rol || "Sin dato"}</span></div>
            <div className="wide"><strong>Tareas</strong><span>{persona.tareas || "Sin detalle"}</span></div>
          </div>
        )}
      </div>
    </details>
  );
}

export function StaffManager({
  personas,
  areas,
  editable,
  initialAreaId = "",
}: {
  personas: PersonalCultural[];
  areas: AreaPersonalOption[];
  editable: boolean;
  initialAreaId?: string;
}) {
  const [consulta, setConsulta] = useState("");
  const [areaSeleccionada, setAreaSeleccionada] = useState(initialAreaId || "todas");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("vigentes");

  const personasFiltradas = useMemo(() => {
    const texto = consulta.trim().toLocaleLowerCase("es");

    return personas.filter((persona) => {
      if (areaSeleccionada !== "todas" && persona.areaId !== areaSeleccionada) return false;
      if (estadoSeleccionado === "vigentes" && persona.estado === "baja") return false;
      if (estadoSeleccionado !== "todos" && estadoSeleccionado !== "vigentes" && persona.estado !== estadoSeleccionado) return false;

      if (!texto) return true;

      const area = areas.find((item) => item.id === persona.areaId);
      const espacio = area?.espacios.find((item) => item.id === persona.spaceId);
      return [
        persona.nombre,
        persona.legajo,
        persona.rol,
        persona.tareas,
        area?.nombre,
        espacio?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(texto);
    });
  }, [personas, areas, consulta, areaSeleccionada, estadoSeleccionado]);

  const areaAlta =
    areaSeleccionada !== "todas" && areas.some((item) => item.id === areaSeleccionada)
      ? areaSeleccionada
      : areas[0]?.id ?? "";

  return (
    <div className="page-stack">
      {editable ? <CrearPersonalForm areas={areas} areaInicial={areaAlta} /> : null}

      <section className="panel staff-directory">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Directorio institucional</span>
            <h2>Personal cargado</h2>
          </div>
          <span className="space-count">{personasFiltradas.length} personas</span>
        </div>

        <div className="staff-filters">
          <label className="staff-search">
            <Search size={17} />
            <input
              value={consulta}
              onChange={(event) => setConsulta(event.target.value)}
              placeholder="Buscar por nombre, legajo, rol o espacio"
            />
          </label>

          <select value={areaSeleccionada} onChange={(event) => setAreaSeleccionada(event.target.value)}>
            {areas.length > 1 ? <option value="todas">Todas las dependencias</option> : null}
            {areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}
          </select>

          <select value={estadoSeleccionado} onChange={(event) => setEstadoSeleccionado(event.target.value)}>
            <option value="vigentes">Vigentes</option>
            <option value="activo">Activos</option>
            <option value="licencia">Licencia</option>
            <option value="a_confirmar">A confirmar</option>
            <option value="baja">Bajas</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        {personasFiltradas.length === 0 ? (
          <div className="inline-empty compact-empty">
            <Users size={30} />
            <strong>No hay personal con estos filtros</strong>
            <span>PodÃ©s cambiar la bÃºsqueda o agregar una nueva persona.</span>
          </div>
        ) : (
          <div className="staff-list">
            {personasFiltradas.map((persona) => (
              <EditorPersonal
                key={persona.id}
                persona={persona}
                areas={areas}
                editable={editable}
              />
            ))}
          </div>
        )}
      </section>

      <div className="data-note">
        <BadgeCheck size={20} />
        <span>Dar de baja no borra a la persona: conserva su ficha para mantener el historial institucional.</span>
      </div>
    </div>
  );
}