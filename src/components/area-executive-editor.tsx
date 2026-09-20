"use client";

import { useActionState } from "react";
import { CheckCircle2, CircleAlert, Save } from "lucide-react";
import {
  guardarFichaEjecutiva,
  type AreaExecutiveState,
} from "@/app/(plataforma)/areas/area-executive-actions";

const inicial: AreaExecutiveState = { ok: false, mensaje: "" };

export function AreaExecutiveEditor({
  areaId,
  agenda,
  resumen,
  necesidades,
}: {
  areaId: string;
  agenda: string;
  resumen: string;
  necesidades: string;
}) {
  const [estado, action, pendiente] = useActionState(guardarFichaEjecutiva, inicial);

  return (
    <form action={action} className="area-executive-editor">
      <input type="hidden" name="area_id" value={areaId} />

      <label className="wide">
        <span>Agenda escrita</span>
        <textarea name="written_agenda" rows={5} defaultValue={agenda}
          placeholder="Fechas, reuniones, hitos y temas a tratar…" />
      </label>

      <label>
        <span>Situación actual</span>
        <textarea name="management_summary" rows={4} defaultValue={resumen}
          placeholder="Síntesis breve del estado actual." />
      </label>

      <label>
        <span>Necesidades / requerimientos</span>
        <textarea name="management_needs" rows={4} defaultValue={necesidades}
          placeholder="Necesidades operativas, administrativas o edilicias." />
      </label>

      <div className="area-executive-actions wide">
        {estado.mensaje ? (
          <span className={estado.ok ? "form-success" : "form-error"}>
            {estado.ok ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
            {estado.mensaje}
          </span>
        ) : null}
        <button className="button primary" type="submit" disabled={pendiente}>
          <Save size={16} />
          {pendiente ? "Guardando…" : "Guardar ficha"}
        </button>
      </div>
    </form>
  );
}