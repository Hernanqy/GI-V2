import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { EditEventForm } from "@/components/edit-event-form";
import { obtenerAreas } from "@/lib/areas-data";
import { createClient } from "@/lib/supabase/server";

function aFechaHoraLocal(valor: string | null) {
  if (!valor) return "";
  const partes = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).formatToParts(new Date(valor));
  const dato = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${dato.year}-${dato.month}-${dato.day}T${dato.hour}:${dato.minute}`;
}

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [eventoResult, areas] = await Promise.all([supabase.from("entries").select("id, kind, title, details, area_id, space_id, starts_at, ends_at, priority, status").eq("id", id).in("kind", ["evento", "reunion"]).maybeSingle(), obtenerAreas()]);
  if (eventoResult.error) throw new Error(`No se pudo cargar el evento: ${eventoResult.error.message}`);
  if (!eventoResult.data || (eventoResult.data.kind !== "evento" && eventoResult.data.kind !== "reunion") || !eventoResult.data.starts_at) notFound();
  const evento = eventoResult.data;
  const tipoEvento: "evento" | "reunion" = evento.kind === "reunion" ? "reunion" : "evento";
  return <div className="page-stack">
    <section className="page-heading"><div><span className="eyebrow">Programación institucional</span><h1>Editar evento</h1><p>Actualizá la información que se muestra en Eventos, Agenda e Inicio.</p></div><span className="heading-icon"><CalendarDays size={23}/></span></section>
    <EditEventForm evento={{ id: evento.id, kind: tipoEvento, title: evento.title, details: evento.details ?? "", area_id: evento.area_id, space_id: evento.space_id ?? "", starts_at: aFechaHoraLocal(evento.starts_at), ends_at: aFechaHoraLocal(evento.ends_at), priority: evento.priority, status: evento.status }} areas={areas.map(({ id: areaId, nombre, espacios }) => ({ id: areaId, nombre, espacios }))}/>
  </div>;
}
