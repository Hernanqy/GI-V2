import Link from "next/link";
import { CheckCircle2, Circle, ClipboardList, Pencil, Plus } from "lucide-react";
import { actualizarEstadoSolicitud } from "./actions";
import { DeleteRequestButton } from "@/components/delete-request-button";
import { createClient } from "@/lib/supabase/server";

function mostrarFecha(fecha: string | null) {
  if (!fecha) return "Sin vencimiento";
  const [year, month, day] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

const prioridades = {
  normal: "Normal",
  alta: "Alta",
  compromiso_prioritario: "Compromiso prioritario",
};

export default async function SolicitudesPage() {
  const supabase = await createClient();
  const [solicitudesResult, areasResult, espaciosResult] = await Promise.all([
    supabase.from("entries").select("id, title, details, area_id, space_id, status, priority, due_date, created_at").eq("kind", "solicitud").neq("status", "cancelado").order("created_at", { ascending: false }),
    supabase.from("areas").select("id, name"),
    supabase.from("spaces").select("id, name"),
  ]);

  if (solicitudesResult.error) {
    throw new Error(`No se pudieron cargar las solicitudes: ${solicitudesResult.error.message}`);
  }

  const nombresAreas = new Map((areasResult.data ?? []).map((area) => [area.id, area.name]));
  const nombresEspacios = new Map((espaciosResult.data ?? []).map((espacio) => [espacio.id, espacio.name]));
  const solicitudes = solicitudesResult.data;
  const pendientes = solicitudes.filter((item) => item.status !== "completado");
  const completadas = solicitudes.filter((item) => item.status === "completado");

  return <div className="page-stack">
    <section className="page-heading"><div><span className="eyebrow">Seguimiento interno</span><h1>Solicitudes</h1><p>Necesidades de cada área con seguimiento de Coordinación y Subsecretaría.</p></div><Link className="button primary" href="/registrar"><Plus size={18}/>Nueva solicitud</Link></section>

    <section className="request-summary" aria-label="Resumen de solicitudes"><div><strong>{pendientes.length}</strong><span>Pendientes</span></div><div><strong>{completadas.length}</strong><span>Completadas</span></div><div><strong>{solicitudes.length}</strong><span>Total</span></div></section>

    <section className="panel request-panel">
      <div className="section-heading compact"><div><span className="eyebrow">To-Do institucional</span><h2>Pendientes</h2></div></div>
      {pendientes.length === 0 ? <div className="inline-empty"><ClipboardList size={34}/><strong>No hay solicitudes pendientes</strong><span>Las nuevas solicitudes aparecerán aquí.</span></div> : <div className="request-list">{pendientes.map((item) => <article className="request-row" key={item.id}>
        <form action={actualizarEstadoSolicitud}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value="completado"/><button className="request-check" type="submit" aria-label={`Marcar como completada: ${item.title}`} title="Marcar como completada"><Circle size={22}/></button></form>
        <div className="request-body"><div className="request-title"><strong>{item.title}</strong><span className={`priority priority-${item.priority}`}>{prioridades[item.priority]}</span></div><p>{item.details}</p><small>{nombresAreas.get(item.area_id) ?? "Área sin identificar"}{item.space_id ? ` · ${nombresEspacios.get(item.space_id) ?? "Espacio"}` : ""} · {mostrarFecha(item.due_date)}</small><div className="request-actions"><Link className="request-action" href={`/solicitudes/${item.id}/editar`}><Pencil size={16}/><span>Editar</span></Link><DeleteRequestButton id={item.id} titulo={item.title}/></div></div>
      </article>)}</div>}
    </section>

    {completadas.length > 0 ? <section className="panel request-panel completed"><div className="section-heading compact"><div><span className="eyebrow">Historial reciente</span><h2>Completadas</h2></div></div><div className="request-list">{completadas.map((item) => <article className="request-row" key={item.id}>
      <form action={actualizarEstadoSolicitud}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value="pendiente"/><button className="request-check done" type="submit" aria-label={`Reabrir solicitud: ${item.title}`} title="Reabrir solicitud"><CheckCircle2 size={22}/></button></form>
      <div className="request-body"><div className="request-title"><strong>{item.title}</strong></div><p>{item.details}</p><small>{nombresAreas.get(item.area_id) ?? "Área sin identificar"} · {mostrarFecha(item.due_date)}</small><div className="request-actions"><Link className="request-action" href={`/solicitudes/${item.id}/editar`}><Pencil size={16}/><span>Editar</span></Link><DeleteRequestButton id={item.id} titulo={item.title}/></div></div>
    </article>)}</div></section> : null}
  </div>;
}
