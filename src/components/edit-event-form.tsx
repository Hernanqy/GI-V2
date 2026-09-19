"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CalendarDays, CheckCircle2, CircleAlert, Save } from "lucide-react";
import { editarEvento, type EditarEventoEstado } from "@/app/(plataforma)/eventos/actions";

type AreaFormulario = { id: string; nombre: string; espacios: Array<{ id: string; nombre: string }> };
type EventoEditable = {
  id: string;
  kind: "evento" | "reunion";
  title: string;
  details: string;
  area_id: string;
  space_id: string;
  starts_at: string;
  ends_at: string;
  priority: "normal" | "alta" | "compromiso_prioritario";
  status: "borrador" | "pendiente" | "confirmado" | "completado" | "cancelado";
};

const estadoInicial: EditarEventoEstado = { ok: false, mensaje: "" };

export function EditEventForm({ evento, areas }: { evento: EventoEditable; areas: AreaFormulario[] }) {
  const action = editarEvento.bind(null, evento.id);
  const [estado, formAction, pendiente] = useActionState(action, estadoInicial);
  const [areaSeleccionada, setAreaSeleccionada] = useState(evento.area_id);
  const espacios = areas.find((area) => area.id === areaSeleccionada)?.espacios ?? [];

  return <form className="register-form panel" action={formAction}>
    <div className="form-banner"><strong>Edición de agenda</strong><span>El cambio se reflejará también en Inicio y Agenda.</span></div>
    <div className="form-grid">
      <label><span>Tipo</span><select name="kind" defaultValue={evento.kind}><option value="evento">Actividad o evento</option><option value="reunion">Reunión</option></select></label>
      <label><span>Estado</span><select name="status" defaultValue={evento.status}><option value="borrador">Borrador</option><option value="pendiente">Pendiente</option><option value="confirmado">Confirmado</option><option value="completado">Completado</option><option value="cancelado">Cancelado</option></select></label>
      <label><span>Área responsable</span><select name="area_id" required value={areaSeleccionada} onChange={(event) => setAreaSeleccionada(event.target.value)}>{areas.map(area => <option value={area.id} key={area.id}>{area.nombre}</option>)}</select></label>
      <label><span>Espacio específico</span><select name="space_id" defaultValue={evento.space_id} key={areaSeleccionada}><option value="">Todo el área / no corresponde</option>{espacios.map(espacio => <option value={espacio.id} key={espacio.id}>{espacio.nombre}</option>)}</select></label>
      <label><span>Inicio</span><div className="input-wrap"><CalendarDays size={17}/><input name="starts_at" type="datetime-local" required defaultValue={evento.starts_at}/></div></label>
      <label><span>Finalización opcional</span><div className="input-wrap"><CalendarDays size={17}/><input name="ends_at" type="datetime-local" defaultValue={evento.ends_at}/></div></label>
      <label><span>Prioridad</span><select name="priority" defaultValue={evento.priority}><option value="normal">Normal</option><option value="alta">Alta</option><option value="compromiso_prioritario">Compromiso prioritario</option></select></label>
      <label className="wide"><span>Título</span><input name="title" required minLength={3} defaultValue={evento.title}/></label>
      <label className="wide"><span>Detalle</span><textarea name="details" required minLength={3} rows={6} defaultValue={evento.details}/></label>
    </div>
    <div className="form-actions">
      {estado.mensaje ? <span className={estado.ok ? "form-success" : "form-error"}>{estado.ok ? <CheckCircle2 size={18}/> : <CircleAlert size={18}/>} {estado.mensaje}</span> : <span>Los cambios quedarán registrados inmediatamente.</span>}
      <div className="form-button-group"><Link className="button" href="/eventos">Volver</Link><button className="button primary" type="submit" disabled={pendiente}><Save size={18}/>{pendiente ? "Guardando…" : "Guardar cambios"}</button></div>
    </div>
  </form>;
}
