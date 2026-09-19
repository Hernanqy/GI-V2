"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CalendarDays, CheckCircle2, CircleAlert, Save } from "lucide-react";
import { editarSolicitud, type EditarSolicitudEstado } from "@/app/(plataforma)/solicitudes/actions";

type AreaFormulario = {
  id: string;
  nombre: string;
  espacios: Array<{ id: string; nombre: string }>;
};

type SolicitudEditable = {
  id: string;
  title: string;
  details: string;
  area_id: string;
  space_id: string;
  due_date: string;
  priority: "normal" | "alta" | "compromiso_prioritario";
};

const estadoInicial: EditarSolicitudEstado = { ok: false, mensaje: "" };

export function EditRequestForm({ solicitud, areas }: { solicitud: SolicitudEditable; areas: AreaFormulario[] }) {
  const action = editarSolicitud.bind(null, solicitud.id);
  const [estado, formAction, pendiente] = useActionState(action, estadoInicial);
  const [areaSeleccionada, setAreaSeleccionada] = useState(solicitud.area_id);
  const espacios = areas.find((area) => area.id === areaSeleccionada)?.espacios ?? [];

  return <form className="register-form panel" action={formAction}>
    <div className="form-banner"><strong>Edición activa</strong><span>Los cambios reemplazarán la información actual de esta solicitud.</span></div>
    <div className="form-grid">
      <label><span>Área responsable</span><select name="area_id" required value={areaSeleccionada} onChange={(event) => setAreaSeleccionada(event.target.value)}>{areas.map(area => <option value={area.id} key={area.id}>{area.nombre}</option>)}</select></label>
      <label><span>Espacio específico</span><select name="space_id" defaultValue={solicitud.space_id} key={areaSeleccionada}><option value="">Todo el área / no corresponde</option>{espacios.map(espacio => <option value={espacio.id} key={espacio.id}>{espacio.nombre}</option>)}</select></label>
      <label><span>Fecha o vencimiento</span><div className="input-wrap"><CalendarDays size={17}/><input name="due_date" type="date" defaultValue={solicitud.due_date}/></div></label>
      <label><span>Prioridad</span><select name="priority" defaultValue={solicitud.priority}><option value="normal">Normal</option><option value="alta">Alta</option><option value="compromiso_prioritario">Compromiso prioritario</option></select></label>
      <label className="wide"><span>Título</span><input name="title" required minLength={3} defaultValue={solicitud.title}/></label>
      <label className="wide"><span>Detalle</span><textarea name="details" required minLength={3} rows={6} defaultValue={solicitud.details}/></label>
    </div>
    <div className="form-actions">
      {estado.mensaje ? <span className={estado.ok ? "form-success" : "form-error"}>{estado.ok ? <CheckCircle2 size={18}/> : <CircleAlert size={18}/>} {estado.mensaje}</span> : <span>Modificá solamente los datos necesarios.</span>}
      <div className="form-button-group"><Link className="button" href="/solicitudes">Volver</Link><button className="button primary" type="submit" disabled={pendiente}><Save size={18}/>{pendiente ? "Guardando…" : "Guardar cambios"}</button></div>
    </div>
  </form>;
}
