"use client";

import { useActionState, useEffect, useRef } from "react";
import { Building2, CheckCircle2, ChevronDown, CircleAlert, MapPin, Plus, Save, Trash2 } from "lucide-react";
import {
  crearEspacio,
  editarEspacio,
  eliminarEspacio,
  type DependenciaEstado,
} from "@/app/(plataforma)/areas/actions";
import type { EspacioCultural } from "@/lib/areas-data";

const estadoInicial: DependenciaEstado = { ok: false, mensaje: "" };

function Mensaje({ estado }: { estado: DependenciaEstado }) {
  if (!estado.mensaje) return null;
  return (
    <span className={estado.ok ? "form-success" : "form-error"}>
      {estado.ok ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}
      {estado.mensaje}
    </span>
  );
}

function SpaceCreateForm({ areaId, slug }: { areaId: string; slug: string }) {
  const [estado, formAction, pendiente] = useActionState(crearEspacio, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-create-form">
      <input type="hidden" name="area_id" value={areaId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="space-create-heading"><Plus size={18} /><strong>Agregar espacio</strong></div>
      <div className="structure-form">
        <label><span>Nombre</span><input name="name" required minLength={2} placeholder="Nombre del espacio" /></label>
        <label><span>Tipo</span><input name="space_type" placeholder="Museo, centro cultural, escuela…" /></label>
        <label><span>Localidad</span><input name="locality" placeholder="Olavarría, Hinojo, Sierras Bayas…" /></label>
        <label><span>Dirección</span><input name="address" placeholder="Domicilio, si está validado" /></label>
        <div className="structure-form-actions wide">
          <Mensaje estado={estado} />
          <button className="button primary" type="submit" disabled={pendiente}><Save size={16} />{pendiente ? "Agregando…" : "Agregar espacio"}</button>
        </div>
      </div>
    </form>
  );
}

function SpaceEditor({ espacio, areaId, slug }: { espacio: EspacioCultural; areaId: string; slug: string }) {
  const [estadoEdicion, editarAction, editando] = useActionState(editarEspacio, estadoInicial);
  const [estadoEliminacion, eliminarAction, eliminando] = useActionState(eliminarEspacio, estadoInicial);
  const ubicacion = [espacio.direccion, espacio.localidad].filter(Boolean).join(" · ");

  return (
    <details className="space-editor">
      <summary>
        <span className="space-editor-icon"><Building2 size={17} /></span>
        <span className="space-editor-title">
          <strong>{espacio.nombre}</strong>
          <small>{espacio.tipo || ubicacion || "Sin ficha complementaria"}</small>
        </span>
        {ubicacion ? <span className="space-location"><MapPin size={14} />{ubicacion}</span> : null}
        <ChevronDown className="space-chevron" size={18} />
      </summary>
      <div className="space-editor-body">
        <form action={editarAction} className="structure-form">
          <input type="hidden" name="id" value={espacio.id} />
          <input type="hidden" name="area_id" value={areaId} />
          <input type="hidden" name="slug" value={slug} />
          <label><span>Nombre</span><input name="name" required minLength={2} defaultValue={espacio.nombre} /></label>
          <label><span>Tipo</span><input name="space_type" defaultValue={espacio.tipo} placeholder="Museo, centro cultural, escuela…" /></label>
          <label><span>Localidad</span><input name="locality" defaultValue={espacio.localidad} /></label>
          <label><span>Dirección</span><input name="address" defaultValue={espacio.direccion} /></label>
          <div className="structure-form-actions wide">
            <Mensaje estado={estadoEdicion} />
            <button className="button" type="submit" disabled={editando}><Save size={16} />{editando ? "Guardando…" : "Guardar espacio"}</button>
          </div>
        </form>
        <div className="space-delete-row">
          <div>
            <strong>Eliminar espacio</strong>
            <span>Si tiene registros asociados, la eliminación se bloquea para preservar el historial.</span>
          </div>
          <form
            action={eliminarAction}
            onSubmit={(event) => {
              if (!window.confirm(`¿Eliminar definitivamente el espacio “${espacio.nombre}”?`)) event.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={espacio.id} />
            <input type="hidden" name="area_id" value={areaId} />
            <input type="hidden" name="slug" value={slug} />
            <button className="button danger" type="submit" disabled={eliminando}><Trash2 size={16} />{eliminando ? "Comprobando…" : "Eliminar"}</button>
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
          <span className="eyebrow">Estructura interna</span>
          <h2>Espacios de la dependencia</h2>
        </div>
        <span className="space-count">{espacios.length} {espacios.length === 1 ? "espacio" : "espacios"}</span>
      </div>

      {espacios.length === 0 ? (
        <div className="inline-empty compact-empty">
          <Building2 size={30} />
          <strong>Sin espacios cargados</strong>
          <span>Podés agregar el primer espacio desde esta misma ficha.</span>
        </div>
      ) : editable ? (
        <div className="space-editor-list">
          {espacios.map((espacio) => <SpaceEditor key={espacio.id} espacio={espacio} areaId={areaId} slug={slug} />)}
        </div>
      ) : (
        <div className="space-list">
          {espacios.map((espacio) => (
            <div key={espacio.id}>
              <span>{espacio.nombre.slice(0, 1)}</span>
              <strong>{espacio.nombre}</strong>
              <em>{espacio.tipo || espacio.localidad || "Ficha disponible"}</em>
            </div>
          ))}
        </div>
      )}

      {editable ? <SpaceCreateForm areaId={areaId} slug={slug} /> : null}
    </section>
  );
}
