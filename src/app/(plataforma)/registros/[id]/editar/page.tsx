import { notFound } from "next/navigation";
import { FilePenLine } from "lucide-react";
import { EditRecordForm } from "@/components/edit-record-form";
import { obtenerAreas } from "@/lib/areas-data";
import { createClient } from "@/lib/supabase/server";

export default async function EditarRegistroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [registroResult, areas] = await Promise.all([supabase.from("entries").select("id, kind, title, details, area_id, space_id, due_date, priority").eq("id", id).in("kind", ["nota", "actualizacion"]).maybeSingle(), obtenerAreas()]);
  if (registroResult.error) throw new Error(`No se pudo cargar el registro: ${registroResult.error.message}`);
  if (!registroResult.data || (registroResult.data.kind !== "nota" && registroResult.data.kind !== "actualizacion")) notFound();
  const registro = registroResult.data;
  const tipoRegistro: "nota" | "actualizacion" = registro.kind === "actualizacion" ? "actualizacion" : "nota";
  return <div className="page-stack"><section className="page-heading"><div><span className="eyebrow">Memoria institucional</span><h1>Editar registro</h1><p>Actualizá la nota sin perder su pertenencia a la Bitácora.</p></div><span className="heading-icon"><FilePenLine size={23}/></span></section><EditRecordForm registro={{ id: registro.id, kind: tipoRegistro, title: registro.title, details: registro.details ?? "", area_id: registro.area_id, space_id: registro.space_id ?? "", due_date: registro.due_date ?? "", priority: registro.priority }} areas={areas.map(({ id: areaId, nombre, espacios }) => ({ id: areaId, nombre, espacios }))}/></div>;
}
