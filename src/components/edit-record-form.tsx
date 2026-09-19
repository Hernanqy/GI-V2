"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CalendarDays, CheckCircle2, CircleAlert, Save } from "lucide-react";
import { editarRegistro, type EditarRegistroEstado } from "@/app/(plataforma)/registros/actions";

type AreaFormulario = { id: string; nombre: string; espacios: Array<{ id: string; nombre: string }> };
type RegistroEditable = { id: string; kind: "nota" | "actualizacion"; title: string; details: string; area_id: string; space_id: string; due_date: string; priority: "normal" | "alta" | "compromiso_prioritario" };
const estadoInicial: EditarRegistroEstado = { ok: false, mensaje: "" };

export function EditRecordForm({ registro, areas }: { registro: RegistroEditable; areas: AreaFormulario[] }) {
  const action = editarRegistro.bind(null, registro.id);
  const [estado, formAction, pendiente] = useActionState(action, estadoInicial);
  const [areaSeleccionada, setAreaSeleccionada] = useState(registro.area_id);
  const espacios = areas.find((area) => area.id === areaSeleccionada)?.espacios ?? [];
  return <form className="register-form panel" action={formAction}>
    <div className="form-banner"><strong>Edición de Bitácora</strong><span>El cambio conservará el registro institucional.</span></div>
    <div className="form-grid">
      <label><span>Tipo</span><select name="kind" defaultValue={registro.kind}><option value="nota">Nota institucional</option><option value="actualizacion">Actualización de información</option></select></label>
      <label><span>Fecha del registro</span><div className="input-wrap"><CalendarDays size={17}/><input name="due_date" type="date" defaultValue={registro.due_date}/></div></label>
      <label><span>Área responsable</span><select name="area_id" required value={areaSeleccionada} onChange={(event) => setAreaSeleccionada(event.target.value)}>{areas.map((area) => <option value={area.id} key={area.id}>{area.nombre}</option>)}</select></label>
      <label><span>Espacio específico</span><select name="space_id" defaultValue={registro.space_id} key={areaSeleccionada}><option value="">Todo el área / no corresponde</option>{espacios.map((espacio) => <option value={espacio.id} key={espacio.id}>{espacio.nombre}</option>)}</select></label>
      <label><span>Prioridad</span><select name="priority" defaultValue={registro.priority}><option value="normal">Normal</option><option value="alta">Alta</option><option value="compromiso_prioritario">Compromiso prioritario</option></select></label>
      <label className="wide"><span>Título</span><input name="title" required minLength={3} defaultValue={registro.title}/></label>
      <label className="wide"><span>Detalle</span><textarea name="details" required minLength={3} rows={6} defaultValue={registro.details}/></label>
    </div>
    <div className="form-actions">{estado.mensaje ? <span className={estado.ok ? "form-success" : "form-error"}>{estado.ok ? <CheckCircle2 size={18}/> : <CircleAlert size={18}/>} {estado.mensaje}</span> : <span>Los cambios quedarán disponibles inmediatamente.</span>}<div className="form-button-group"><Link className="button" href="/registros">Volver</Link><button className="button primary" type="submit" disabled={pendiente}><Save size={18}/>{pendiente ? "Guardando…" : "Guardar cambios"}</button></div></div>
  </form>;
}
