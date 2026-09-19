import Link from "next/link";
import { CalendarCheck, CheckCircle2, Circle, Pencil, Plus } from "lucide-react";
import { actualizarEstadoEvento } from "./actions";
import { DeleteEventButton } from "@/components/delete-event-button";
import { obtenerEntradasAgenda, type EntradaAgenda } from "@/lib/agenda-data";

const prioridades = { normal: "Normal", alta: "Alta", compromiso_prioritario: "Compromiso prioritario" };

function mostrarFecha(entrada: EntradaAgenda) {
  const inicio = new Date(entrada.inicio);
  const fecha = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" }).format(inicio);
  const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).format(inicio);
  return `${fecha} · ${hora} h`;
}

function EventoRow({ item, completado = false }: { item: EntradaAgenda; completado?: boolean }) {
  return <article className="request-row">
    <form action={actualizarEstadoEvento}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value={completado ? "pendiente" : "completado"}/><button className={`request-check ${completado ? "done" : ""}`} type="submit" aria-label={completado ? `Reabrir: ${item.titulo}` : `Marcar como realizado: ${item.titulo}`} title={completado ? "Reabrir" : "Marcar como realizado"}>{completado ? <CheckCircle2 size={22}/> : <Circle size={22}/>}</button></form>
    <div className="request-body"><div className="request-title"><strong>{item.titulo}</strong><span className={`priority priority-${item.prioridad}`}>{prioridades[item.prioridad]}</span></div><p>{item.detalle}</p><small>{item.tipo === "reunion" ? "Reunión" : "Evento"} · {item.area}{item.espacio ? ` · ${item.espacio}` : ""} · {mostrarFecha(item)}</small><div className="request-actions"><Link className="request-action" href={`/eventos/${item.id}/editar`}><Pencil size={16}/><span>Editar</span></Link><DeleteEventButton id={item.id} titulo={item.titulo}/></div></div>
  </article>;
}

export default async function EventosPage() {
  const entradas = await obtenerEntradasAgenda();
  const activas = entradas.filter((item) => item.estado !== "completado");
  const realizadas = entradas.filter((item) => item.estado === "completado");
  const confirmadas = activas.filter((item) => item.estado === "confirmado").length;
  return <div className="page-stack">
    <section className="page-heading"><div><span className="eyebrow">Programación institucional</span><h1>Eventos y reuniones</h1><p>Administrá la agenda compartida de todas las áreas.</p></div><Link className="button primary" href="/registrar?tipo=evento"><Plus size={18}/>Nuevo evento</Link></section>
    <section className="request-summary" aria-label="Resumen de agenda"><div><strong>{activas.length}</strong><span>Próximos y pendientes</span></div><div><strong>{confirmadas}</strong><span>Confirmados</span></div><div><strong>{realizadas.length}</strong><span>Realizados</span></div></section>
    <section className="panel request-panel"><div className="section-heading compact"><div><span className="eyebrow">Agenda de trabajo</span><h2>Activos</h2></div></div>{activas.length === 0 ? <div className="inline-empty"><CalendarCheck size={34}/><strong>No hay eventos activos</strong><span>Registrá un evento o una reunión para incorporarlo a la agenda.</span></div> : <div className="request-list">{activas.map((item) => <EventoRow item={item} key={item.id}/>)}</div>}</section>
    {realizadas.length > 0 ? <section className="panel request-panel completed"><div className="section-heading compact"><div><span className="eyebrow">Historial</span><h2>Realizados</h2></div></div><div className="request-list">{realizadas.map((item) => <EventoRow item={item} completado key={item.id}/>)}</div></section> : null}
  </div>;
}
