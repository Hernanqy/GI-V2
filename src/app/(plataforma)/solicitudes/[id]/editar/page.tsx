import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { EditRequestForm } from "@/components/edit-request-form";
import { obtenerAreas } from "@/lib/areas-data";
import { createClient } from "@/lib/supabase/server";

export default async function EditarSolicitudPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [solicitudResult, areas] = await Promise.all([
    supabase.from("entries").select("id, title, details, area_id, space_id, due_date, priority").eq("id", id).eq("kind", "solicitud").maybeSingle(),
    obtenerAreas(),
  ]);

  if (solicitudResult.error) {
    throw new Error(`No se pudo cargar la solicitud: ${solicitudResult.error.message}`);
  }

  if (!solicitudResult.data) notFound();

  const solicitud = solicitudResult.data;

  return <div className="page-stack">
    <section className="page-heading"><div><span className="eyebrow">Seguimiento interno</span><h1>Editar solicitud</h1><p>Actualizá la información sin perder el registro institucional.</p></div><span className="heading-icon"><Pencil size={23}/></span></section>
    <EditRequestForm
      solicitud={{
        id: solicitud.id,
        title: solicitud.title,
        details: solicitud.details ?? "",
        area_id: solicitud.area_id,
        space_id: solicitud.space_id ?? "",
        due_date: solicitud.due_date ?? "",
        priority: solicitud.priority,
      }}
      areas={areas.map(({ id: areaId, nombre, espacios }) => ({ id: areaId, nombre, espacios }))}
    />
  </div>;
}
