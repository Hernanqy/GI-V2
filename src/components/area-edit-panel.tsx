"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, Save, Trash2 } from "lucide-react";
import {
  editarDependencia,
  eliminarDependencia,
  type DependenciaEstado,
} from "@/app/(plataforma)/areas/actions";

const estadoInicial: DependenciaEstado = { ok: false, mensaje: "" };

export function AreaEditPanel({
  id,
  slug,
  nombre,
  descripcion,
}: {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
}) {
  const router = useRouter();
  const [estadoEdicion, editarAction, editando] = useActionState(editarDependencia, estadoInicial);
  const [estadoEliminacion, eliminarAction, eliminando] = useActionState(eliminarDependencia, estadoInicial);

  useEffect(() => {
    if (estadoEliminacion.eliminada) router.push("/areas");
  }, [estadoEliminacion.eliminada, router]);

  return (
    <section className="panel structure-admin-panel">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Edición</span>
          <h2>Datos de la dependencia</h2>
        </div>
      </div>
      <form action={editarAction} className="structure-form single">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="slug" value={slug} />
        <label>
          <span>Nombre</span>
          <input name="name" required minLength={3} defaultValue={nombre} />
        </label>
        <label>
          <span>Descripción</span>
          <textarea name="description" rows={4} defaultValue={descripcion === "Sin descripción institucional cargada." ? "" : descripcion} />
        </label>
        {estadoEdicion.mensaje ? (
          <span className={estadoEdicion.ok ? "form-success" : "form-error"}>
            {estadoEdicion.ok ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}
            {estadoEdicion.mensaje}
          </span>
        ) : null}
        <button className="button primary" type="submit" disabled={editando}>
          <Save size={17} />
          {editando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <div className="danger-zone">
        <strong>Eliminar dependencia</strong>
        <p>Solo se permite cuando no tiene espacios, registros ni usuarios asociados.</p>
        <form
          action={eliminarAction}
          onSubmit={(event) => {
            if (!window.confirm(`¿Eliminar definitivamente “${nombre}”?`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="slug" value={slug} />
          <button className="button danger" type="submit" disabled={eliminando}>
            <Trash2 size={16} />
            {eliminando ? "Comprobando…" : "Eliminar dependencia"}
          </button>
        </form>
        {estadoEliminacion.mensaje && !estadoEliminacion.eliminada ? (
          <span className="form-error"><CircleAlert size={17} />{estadoEliminacion.mensaje}</span>
        ) : null}
      </div>
    </section>
  );
}
