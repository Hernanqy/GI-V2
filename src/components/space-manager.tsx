"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  ClipboardList,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  crearEspacio,
  editarEspacio,
  eliminarEspacio,
  type DependenciaEstado,
} from "@/app/(plataforma)/areas/actions";
import type { EspacioCultural } from "@/lib/areas-data";

const estadoInicial: DependenciaEstado = {
  ok: false,
  mensaje: "",
};

const etiquetasEstado: Record<string, string> = {
  activo: "Activo",
  actividad_parcial: "Actividad parcial",
  cerrado_temporalmente: "Cerrado temporalmente",
  sin_referente: "Sin referente",
  a_confirmar: "A confirmar",
};

function etiquetaEstado(valor: string) {
  return etiquetasEstado[valor] ?? "A confirmar";
}

function Mensaje({
  estado,
}: {
  estado: DependenciaEstado;
}) {
  if (!estado.mensaje) return null;

  return (
    <span className={estado.ok ? "form-success" : "form-error"}>
      {estado.ok ? (
        <CheckCircle2 size={17} />
      ) : (
        <CircleAlert size={17} />
      )}

      {estado.mensaje}
    </span>
  );
}

function SpaceCreateForm({
  areaId,
  slug,
}: {
  areaId: string;
  slug: string;
}) {
  const [estado, formAction, pendiente] =
    useActionState(crearEspacio, estadoInicial);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) {
      formRef.current?.reset();
    }
  }, [estado.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-create-form"
    >
      <input
        type="hidden"
        name="area_id"
        value={areaId}
      />

      <input
        type="hidden"
        name="slug"
        value={slug}
      />

      <div className="space-create-heading">
        <Plus size={18} />
        <strong>Agregar espacio</strong>
      </div>

      <div className="structure-form">
        <label>
          <span>Nombre</span>
          <input
            name="name"
            required
            minLength={2}
            placeholder="Nombre del espacio"
          />
        </label>

        <label>
          <span>Tipo</span>
          <input
            name="space_type"
            placeholder="Museo, centro cultural, escuela…"
          />
        </label>

        <label>
          <span>Localidad</span>
          <input
            name="locality"
            placeholder="Olavarría, Hinojo, Sierras Bayas…"
          />
        </label>

        <label>
          <span>Dirección</span>
          <input
            name="address"
            placeholder="Domicilio institucional"
          />
        </label>

        <label>
          <span>Responsable / referente</span>
          <input
            name="responsible_name"
            placeholder="Nombre y apellido"
          />
        </label>

        <label>
          <span>Estado operativo</span>
          <select
            name="operational_status"
            defaultValue="activo"
          >
            <option value="activo">Activo</option>
            <option value="actividad_parcial">
              Actividad parcial
            </option>
            <option value="cerrado_temporalmente">
              Cerrado temporalmente
            </option>
            <option value="sin_referente">
              Sin referente
            </option>
            <option value="a_confirmar">
              A confirmar
            </option>
          </select>
        </label>

        <label>
          <span>Horarios</span>
          <input
            name="opening_hours"
            placeholder="Días y horarios"
          />
        </label>

        <label>
          <span>Contacto institucional</span>
          <input
            name="public_contact"
            placeholder="Teléfono, correo o canal institucional"
          />
        </label>

        <label className="wide">
          <span>Necesidades / observaciones</span>

          <textarea
            name="management_notes"
            rows={3}
            placeholder="Estado del espacio, necesidades, observaciones de gestión…"
          />
        </label>

        <div className="structure-form-actions wide">
          <Mensaje estado={estado} />

          <button
            className="button primary"
            type="submit"
            disabled={pendiente}
          >
            <Save size={16} />
            {pendiente
              ? "Agregando…"
              : "Agregar espacio"}
          </button>
        </div>
      </div>
    </form>
  );
}

function SpaceEditor({
  espacio,
  areaId,
  slug,
}: {
  espacio: EspacioCultural;
  areaId: string;
  slug: string;
}) {
  const [
    estadoEdicion,
    editarAction,
    editando,
  ] = useActionState(
    editarEspacio,
    estadoInicial,
  );

  const [
    estadoEliminacion,
    eliminarAction,
    eliminando,
  ] = useActionState(
    eliminarEspacio,
    estadoInicial,
  );

  const ubicacion = [
    espacio.direccion,
    espacio.localidad,
  ]
    .filter(Boolean)
    .join(" · ");

  const subtitulo = [
    espacio.tipo,
    espacio.responsable
      ? `Responsable: ${espacio.responsable}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <details className="space-editor">
      <summary>
        <span className="space-editor-icon">
          <Building2 size={17} />
        </span>

        <span className="space-editor-title">
          <strong>{espacio.nombre}</strong>

          <small>
            {subtitulo ||
              ubicacion ||
              "Ficha institucional incompleta"}
          </small>
        </span>

        <span className="space-summary-meta">
          <span
            className={`operational-chip status-${espacio.estadoOperativo}`}
          >
            {etiquetaEstado(
              espacio.estadoOperativo,
            )}
          </span>

          {ubicacion ? (
            <span className="space-location">
              <MapPin size={14} />
              {ubicacion}
            </span>
          ) : null}
        </span>

        <ChevronDown
          className="space-chevron"
          size={18}
        />
      </summary>

      <div className="space-editor-body">
        <div className="space-profile-heading">
          <ClipboardList size={18} />

          <div>
            <strong>
              Ficha institucional y operativa
            </strong>

            <span>
              Información central del espacio para
              gestión interna.
            </span>
          </div>
        </div>

        <form
          action={editarAction}
          className="structure-form"
        >
          <input
            type="hidden"
            name="id"
            value={espacio.id}
          />

          <input
            type="hidden"
            name="area_id"
            value={areaId}
          />

          <input
            type="hidden"
            name="slug"
            value={slug}
          />

          <label>
            <span>Nombre</span>
            <input
              name="name"
              required
              minLength={2}
              defaultValue={espacio.nombre}
            />
          </label>

          <label>
            <span>Tipo</span>
            <input
              name="space_type"
              defaultValue={espacio.tipo}
              placeholder="Museo, centro cultural, escuela…"
            />
          </label>

          <label>
            <span>Localidad</span>
            <input
              name="locality"
              defaultValue={espacio.localidad}
            />
          </label>

          <label>
            <span>Dirección</span>
            <input
              name="address"
              defaultValue={espacio.direccion}
            />
          </label>

          <label>
            <span>
              <UserRound size={14} />
              Responsable / referente
            </span>

            <input
              name="responsible_name"
              defaultValue={espacio.responsable}
              placeholder="Nombre y apellido"
            />
          </label>

          <label>
            <span>Estado operativo</span>

            <select
              name="operational_status"
              defaultValue={
                espacio.estadoOperativo ||
                "a_confirmar"
              }
            >
              <option value="activo">
                Activo
              </option>

              <option value="actividad_parcial">
                Actividad parcial
              </option>

              <option value="cerrado_temporalmente">
                Cerrado temporalmente
              </option>

              <option value="sin_referente">
                Sin referente
              </option>

              <option value="a_confirmar">
                A confirmar
              </option>
            </select>
          </label>

          <label>
            <span>
              <Clock3 size={14} />
              Horarios
            </span>

            <input
              name="opening_hours"
              defaultValue={espacio.horarios}
              placeholder="Días y horarios"
            />
          </label>

          <label>
            <span>
              <Phone size={14} />
              Contacto institucional
            </span>

            <input
              name="public_contact"
              defaultValue={espacio.contacto}
              placeholder="Teléfono, correo o canal institucional"
            />
          </label>

          <label className="wide">
            <span>
              Necesidades / observaciones
            </span>

            <textarea
              name="management_notes"
              rows={4}
              defaultValue={espacio.notasGestion}
              placeholder="Estado edilicio, necesidades, pendientes, observaciones de gestión…"
            />
          </label>

          <div className="structure-form-actions wide">
            <Mensaje estado={estadoEdicion} />

            <button
              className="button primary"
              type="submit"
              disabled={editando}
            >
              <Save size={16} />

              {editando
                ? "Guardando…"
                : "Guardar ficha"}
            </button>
          </div>
        </form>

        <div className="space-delete-row">
          <div>
            <strong>Eliminar espacio</strong>

            <span>
              Si tiene registros asociados, la
              eliminación se bloquea para preservar
              el historial.
            </span>
          </div>

          <form
            action={eliminarAction}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  `¿Eliminar definitivamente el espacio “${espacio.nombre}”?`,
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input
              type="hidden"
              name="id"
              value={espacio.id}
            />

            <input
              type="hidden"
              name="area_id"
              value={areaId}
            />

            <input
              type="hidden"
              name="slug"
              value={slug}
            />

            <button
              className="button danger"
              type="submit"
              disabled={eliminando}
            >
              <Trash2 size={16} />

              {eliminando
                ? "Comprobando…"
                : "Eliminar"}
            </button>
          </form>
        </div>

        <Mensaje estado={estadoEliminacion} />
      </div>
    </details>
  );
}

export function SpaceManager({
  espacios,
  areaId,
  slug,
  editable,
}: {
  espacios: EspacioCultural[];
  areaId: string;
  slug: string;
  editable: boolean;
}) {
  return (
    <section className="panel spaces-panel">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">
            Estructura interna
          </span>

          <h2>
            Espacios de la dependencia
          </h2>
        </div>

        <span className="space-count">
          {espacios.length}{" "}
          {espacios.length === 1
            ? "espacio"
            : "espacios"}
        </span>
      </div>

      {espacios.length === 0 ? (
        <div className="inline-empty compact-empty">
          <Building2 size={30} />

          <strong>
            Sin espacios cargados
          </strong>

          <span>
            Podés agregar el primer espacio desde
            esta misma ficha.
          </span>
        </div>
      ) : editable ? (
        <div className="space-editor-list">
          {espacios.map((espacio) => (
            <SpaceEditor
              key={espacio.id}
              espacio={espacio}
              areaId={areaId}
              slug={slug}
            />
          ))}
        </div>
      ) : (
        <div className="space-list">
          {espacios.map((espacio) => (
            <div key={espacio.id}>
              <span>
                {espacio.nombre.slice(0, 1)}
              </span>

              <strong>
                {espacio.nombre}
              </strong>

              <em>
                {espacio.responsable
                  ? `Responsable: ${espacio.responsable}`
                  : espacio.tipo ||
                    espacio.localidad ||
                    "Ficha disponible"}
              </em>
            </div>
          ))}
        </div>
      )}

      {editable ? (
        <SpaceCreateForm
          areaId={areaId}
          slug={slug}
        />
      ) : null}
    </section>
  );
}