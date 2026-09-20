"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  FileText,
  FolderClock,
  Link2,
  Plus,
  Save,
  Search,
} from "lucide-react";
import {
  archivarDocumento,
  crearDocumento,
  editarDocumento,
  type DocumentActionState,
} from "@/app/(plataforma)/documentos/actions";
import type { DocumentoInstitucional } from "@/lib/documents-data";

export type DocumentAreaOption = {
  id: string;
  nombre: string;
  espacios: Array<{ id: string; nombre: string }>;
};

const inicial: DocumentActionState = { ok: false, mensaje: "" };

const estadoLabel: Record<DocumentoInstitucional["estado"], string> = {
  vigente: "Vigente",
  pendiente_revision: "Pendiente de revisión",
  historico: "Histórico",
  referencia_anual: "Referencia anual",
};

function Mensaje({ estado }: { estado: DocumentActionState }) {
  if (!estado.mensaje) return null;
  return (
    <span className={estado.ok ? "form-success" : "form-error"}>
      {estado.ok ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
      {estado.mensaje}
    </span>
  );
}

function CamposDocumento({
  areas,
  documento,
  canManageGeneral,
}: {
  areas: DocumentAreaOption[];
  documento?: DocumentoInstitucional;
  canManageGeneral: boolean;
}) {
  const areaInicial = documento?.areaId ?? "";
  const [areaId, setAreaId] = useState(areaInicial);
  const area = areas.find((item) => item.id === areaId);

  return (
    <>
      <label className="wide">
        <span>Título</span>
        <input
          name="title"
          required
          minLength={2}
          defaultValue={documento?.titulo ?? ""}
          placeholder="Nombre claro del documento"
        />
      </label>

      <label>
        <span>Dependencia</span>
        <select
          name="area_id"
          value={areaId}
          onChange={(event) => setAreaId(event.target.value)}
          required={!canManageGeneral}
        >
          {canManageGeneral ? <option value="">General / Subsecretaría</option> : null}
          {areas.map((item) => (
            <option key={item.id} value={item.id}>{item.nombre}</option>
          ))}
        </select>
      </label>

      <label>
        <span>Espacio</span>
        <select
          name="space_id"
          key={`${areaId}-${documento?.spaceId ?? "sin-espacio"}`}
          defaultValue={documento?.areaId === areaId ? documento?.spaceId ?? "" : ""}
          disabled={!areaId}
        >
          <option value="">Sin espacio específico</option>
          {(area?.espacios ?? []).map((espacio) => (
            <option key={espacio.id} value={espacio.id}>{espacio.nombre}</option>
          ))}
        </select>
      </label>

      <label>
        <span>Tipo de documento</span>
        <input
          name="document_type"
          defaultValue={documento?.tipo ?? ""}
          placeholder="Planilla, acta, normativa, agenda…"
        />
      </label>

      <label>
        <span>Estado</span>
        <select name="status" defaultValue={documento?.estado ?? "pendiente_revision"}>
          <option value="vigente">Vigente</option>
          <option value="pendiente_revision">Pendiente de revisión</option>
          <option value="referencia_anual">Referencia anual</option>
          <option value="historico">Histórico</option>
        </select>
      </label>

      <label>
        <span>Fuente / origen</span>
        <input
          name="source_name"
          defaultValue={documento?.fuente ?? ""}
          placeholder="Drive, administración, dirección…"
        />
      </label>

      <label>
        <span>Responsable</span>
        <input
          name="responsible_name"
          defaultValue={documento?.responsable ?? ""}
          placeholder="Quién mantiene este documento"
        />
      </label>

      <label className="wide">
        <span>Enlace al documento</span>
        <input
          name="external_url"
          type="url"
          defaultValue={documento?.url ?? ""}
          placeholder="https://drive.google.com/..."
        />
      </label>

      <label>
        <span>Vigente desde</span>
        <input name="valid_from" type="date" defaultValue={documento?.vigenteDesde ?? ""} />
      </label>

      <label>
        <span>Vigente hasta</span>
        <input name="valid_until" type="date" defaultValue={documento?.vigenteHasta ?? ""} />
      </label>

      <label className="wide">
        <span>Observaciones</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={documento?.notas ?? ""}
          placeholder="Qué contiene, para qué se usa o qué falta validar."
        />
      </label>
    </>
  );
}

function CrearDocumento({
  areas,
  canManageGeneral,
}: {
  areas: DocumentAreaOption[];
  canManageGeneral: boolean;
}) {
  const [estado, action, pendiente] = useActionState(crearDocumento, inicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado.ok]);

  return (
    <details className="panel document-create">
      <summary>
        <span className="heading-icon small"><Plus size={19} /></span>
        <span>
          <strong>Agregar documento</strong>
          <small>Registrar una fuente institucional y, si existe, su enlace en Drive u otro repositorio.</small>
        </span>
        <ChevronDown size={19} />
      </summary>

      <form ref={formRef} action={action} className="document-form">
        <CamposDocumento areas={areas} canManageGeneral={canManageGeneral} />
        <div className="document-form-actions wide">
          <Mensaje estado={estado} />
          <button className="button primary" type="submit" disabled={pendiente}>
            <Save size={16} />
            {pendiente ? "Guardando…" : "Agregar documento"}
          </button>
        </div>
      </form>
    </details>
  );
}

function EditorDocumento({
  documento,
  areas,
  editable,
  canManageGeneral,
}: {
  documento: DocumentoInstitucional;
  areas: DocumentAreaOption[];
  editable: boolean;
  canManageGeneral: boolean;
}) {
  const [estado, action, pendiente] = useActionState(editarDocumento, inicial);
  const [estadoArchivo, actionArchivo, archivando] = useActionState(archivarDocumento, inicial);
  const area = areas.find((item) => item.id === documento.areaId);
  const espacio = area?.espacios.find((item) => item.id === documento.spaceId);

  return (
    <details className={`document-card document-${documento.estado}`}>
      <summary>
        <span className="document-icon"><FileText size={18} /></span>
        <span className="document-title">
          <strong>{documento.titulo}</strong>
          <small>
            {area?.nombre || "General / Subsecretaría"}
            {espacio ? ` · ${espacio.nombre}` : ""}
            {documento.tipo ? ` · ${documento.tipo}` : ""}
          </small>
        </span>
        <span className="document-meta">
          <b>{estadoLabel[documento.estado]}</b>
          {documento.url ? (
            <a
              href={documento.url}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              Abrir <ExternalLink size={13} />
            </a>
          ) : null}
        </span>
        <ChevronDown size={18} />
      </summary>

      <div className="document-card-body">
        {editable ? (
          <>
            <form action={action} className="document-form">
              <input type="hidden" name="id" value={documento.id} />
              <CamposDocumento
                areas={areas}
                documento={documento}
                canManageGeneral={canManageGeneral}
              />
              <div className="document-form-actions wide">
                <Mensaje estado={estado} />
                <button className="button" type="submit" disabled={pendiente}>
                  <Save size={16} />
                  {pendiente ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>

            {documento.estado !== "historico" ? (
              <form
                action={actionArchivo}
                className="document-archive"
                onSubmit={(event) => {
                  if (!window.confirm("¿Enviar este documento a Histórico?")) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={documento.id} />
                <Mensaje estado={estadoArchivo} />
                <button className="button danger subtle-danger" type="submit" disabled={archivando}>
                  <Archive size={16} />
                  {archivando ? "Archivando…" : "Enviar a Histórico"}
                </button>
              </form>
            ) : null}
          </>
        ) : (
          <div className="document-readonly">
            <div><strong>Fuente</strong><span>{documento.fuente || "Sin dato"}</span></div>
            <div><strong>Responsable</strong><span>{documento.responsable || "Sin dato"}</span></div>
            <div><strong>Vigencia</strong><span>{[documento.vigenteDesde, documento.vigenteHasta].filter(Boolean).join(" → ") || "Sin fecha definida"}</span></div>
            <div className="wide"><strong>Observaciones</strong><span>{documento.notas || "Sin observaciones"}</span></div>
          </div>
        )}
      </div>
    </details>
  );
}

export function DocumentManager({
  documentos,
  areas,
  editable,
  canManageGeneral,
}: {
  documentos: DocumentoInstitucional[];
  areas: DocumentAreaOption[];
  editable: boolean;
  canManageGeneral: boolean;
}) {
  const [consulta, setConsulta] = useState("");
  const [areaId, setAreaId] = useState("todas");
  const [estado, setEstado] = useState("activos");

  const filtrados = useMemo(() => {
    const q = consulta.trim().toLocaleLowerCase("es");

    return documentos.filter((documento) => {
      if (areaId === "general" && documento.areaId !== null) return false;
      if (areaId !== "todas" && areaId !== "general" && documento.areaId !== areaId) return false;

      if (estado === "activos" && documento.estado === "historico") return false;
      if (estado !== "todos" && estado !== "activos" && documento.estado !== estado) return false;

      if (!q) return true;

      const area = areas.find((item) => item.id === documento.areaId);
      const espacio = area?.espacios.find((item) => item.id === documento.spaceId);

      return [
        documento.titulo,
        documento.tipo,
        documento.fuente,
        documento.responsable,
        documento.notas,
        area?.nombre,
        espacio?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(q);
    });
  }, [documentos, areas, consulta, areaId, estado]);

  return (
    <div className="page-stack">
      {editable ? <CrearDocumento areas={areas} canManageGeneral={canManageGeneral} /> : null}

      <section className="panel document-directory">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Repositorio institucional</span>
            <h2>Documentos registrados</h2>
          </div>
          <span className="space-count">{filtrados.length} visibles</span>
        </div>

        <div className="document-summary">
          <div><strong>{documentos.length}</strong><span>Total</span></div>
          <div><strong>{documentos.filter((item) => item.estado === "vigente").length}</strong><span>Vigentes</span></div>
          <div><strong>{documentos.filter((item) => item.estado === "pendiente_revision").length}</strong><span>Por revisar</span></div>
          <div><strong>{documentos.filter((item) => item.estado === "historico").length}</strong><span>Históricos</span></div>
        </div>

        <div className="document-filters">
          <label className="document-search">
            <Search size={17} />
            <input
              value={consulta}
              onChange={(event) => setConsulta(event.target.value)}
              placeholder="Buscar título, fuente, responsable o espacio"
            />
          </label>

          <select value={areaId} onChange={(event) => setAreaId(event.target.value)}>
            <option value="todas">Todas las dependencias</option>
            {canManageGeneral ? <option value="general">General / Subsecretaría</option> : null}
            {areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}
          </select>

          <select value={estado} onChange={(event) => setEstado(event.target.value)}>
            <option value="activos">Todos menos históricos</option>
            <option value="vigente">Vigentes</option>
            <option value="pendiente_revision">Pendientes de revisión</option>
            <option value="referencia_anual">Referencia anual</option>
            <option value="historico">Históricos</option>
            <option value="todos">Todos los estados</option>
          </select>
        </div>

        {filtrados.length === 0 ? (
          <div className="inline-empty compact-empty">
            <FolderClock size={30} />
            <strong>No hay documentos con estos filtros</strong>
            <span>Podés registrar el primero desde “Agregar documento”.</span>
          </div>
        ) : (
          <div className="document-list">
            {filtrados.map((documento) => (
              <EditorDocumento
                key={documento.id}
                documento={documento}
                areas={areas}
                editable={editable}
                canManageGeneral={canManageGeneral}
              />
            ))}
          </div>
        )}
      </section>

      <div className="data-note">
        <Link2 size={20} />
        <span>
          Esta etapa registra y organiza las fuentes. Los enlaces de Drive pueden agregarse ahora; la sincronización automática se conectará en una etapa posterior.
        </span>
      </div>
    </div>
  );
}