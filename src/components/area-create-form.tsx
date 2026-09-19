"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, CircleAlert, Plus, Save } from "lucide-react";
import { crearDependencia, type DependenciaEstado } from "@/app/(plataforma)/areas/actions";

const estadoInicial: DependenciaEstado = { ok: false, mensaje: "" };

export function AreaCreateForm() {
  const [estado, formAction, pendiente] = useActionState(crearDependencia, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado.ok]);

  return (
    <section className="panel structure-create-panel">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Administración de estructura</span>
          <h2>Nueva dependencia</h2>
        </div>
        <span className="heading-icon small"><Plus size={20} /></span>
      </div>
      <form ref={formRef} action={formAction} className="structure-form">
        <label>
          <span>Nombre</span>
          <input name="name" required minLength={3} placeholder="Ej.: Casa del Bicentenario" />
        </label>
        <label className="wide">
          <span>Descripción</span>
          <textarea name="description" rows={3} placeholder="Función, alcance o información principal de la dependencia" />
        </label>
        <div className="structure-form-actions wide">
          {estado.mensaje ? (
            <span className={estado.ok ? "form-success" : "form-error"}>
              {estado.ok ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
              {estado.mensaje}
            </span>
          ) : (
            <span>El identificador interno se genera automáticamente.</span>
          )}
          <button className="button primary" type="submit" disabled={pendiente}>
            <Save size={17} />
            {pendiente ? "Creando…" : "Crear dependencia"}
          </button>
        </div>
      </form>
    </section>
  );
}
