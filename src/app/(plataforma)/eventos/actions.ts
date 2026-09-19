"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type EntryStatus = Database["public"]["Enums"]["entry_status"];
type Priority = Database["public"]["Enums"]["priority_level"];

export type EditarEventoEstado = { ok: boolean; mensaje: string };

const estadosPermitidos = new Set<EntryStatus>(["borrador", "pendiente", "confirmado", "completado", "cancelado"]);
const prioridadesPermitidas = new Set<Priority>(["normal", "alta", "compromiso_prioritario"]);
const tiposPermitidos = new Set(["evento", "reunion"]);
const formatoFechaHora = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function leerTexto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function revalidarAgenda() {
  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/eventos");
}

export async function editarEvento(
  id: string,
  _estadoAnterior: EditarEventoEstado,
  formData: FormData,
): Promise<EditarEventoEstado> {
  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = identidad?.claims?.sub;
  if (errorIdentidad || !userId) return { ok: false, mensaje: "La sesión venció. Volvé a ingresar." };

  const kind = leerTexto(formData, "kind");
  const areaId = leerTexto(formData, "area_id");
  const spaceId = leerTexto(formData, "space_id");
  const title = leerTexto(formData, "title");
  const details = leerTexto(formData, "details");
  const startsAtLocal = leerTexto(formData, "starts_at");
  const endsAtLocal = leerTexto(formData, "ends_at");
  const priority = leerTexto(formData, "priority") as Priority;
  const status = leerTexto(formData, "status") as EntryStatus;

  if (!tiposPermitidos.has(kind) || !areaId || title.length < 3 || details.length < 3 || !prioridadesPermitidas.has(priority) || !estadosPermitidos.has(status)) {
    return { ok: false, mensaje: "Revisá los datos obligatorios." };
  }

  if (!formatoFechaHora.test(startsAtLocal) || (endsAtLocal && !formatoFechaHora.test(endsAtLocal))) {
    return { ok: false, mensaje: "Revisá las fechas y horarios." };
  }

  const startsAt = `${startsAtLocal}:00-03:00`;
  const endsAt = endsAtLocal ? `${endsAtLocal}:00-03:00` : null;
  if (endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    return { ok: false, mensaje: "La finalización no puede ser anterior al inicio." };
  }

  const { data: area } = await supabase.from("areas").select("id").eq("id", areaId).eq("active", true).maybeSingle();
  if (!area) return { ok: false, mensaje: "El área seleccionada no está disponible." };

  if (spaceId) {
    const { data: espacio } = await supabase.from("spaces").select("id").eq("id", spaceId).eq("area_id", areaId).eq("active", true).maybeSingle();
    if (!espacio) return { ok: false, mensaje: "El espacio no corresponde al área elegida." };
  }

  const { data, error } = await supabase
    .from("entries")
    .update({
      kind: kind as "evento" | "reunion",
      title,
      details,
      area_id: areaId,
      space_id: spaceId || null,
      starts_at: startsAt,
      ends_at: endsAt,
      due_date: startsAtLocal.slice(0, 10),
      priority,
      status,
      updated_by: userId,
    })
    .eq("id", id)
    .in("kind", ["evento", "reunion"])
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("No se pudo editar el evento", error.message);
    return { ok: false, mensaje: "No se pudieron guardar los cambios." };
  }

  revalidarAgenda();
  revalidatePath(`/eventos/${id}/editar`);
  return { ok: true, mensaje: "Cambios guardados correctamente." };
}

export async function actualizarEstadoEvento(formData: FormData) {
  const id = leerTexto(formData, "id");
  const status = leerTexto(formData, "status") as EntryStatus;
  if (!id || !estadosPermitidos.has(status)) return;

  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = identidad?.claims?.sub;
  if (errorIdentidad || !userId) return;

  const { error } = await supabase.from("entries").update({ status, updated_by: userId }).eq("id", id).in("kind", ["evento", "reunion"]);
  if (error) console.error("No se pudo actualizar el estado", error.message);
  revalidarAgenda();
}

export async function eliminarEvento(formData: FormData) {
  const id = leerTexto(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  if (errorIdentidad || !identidad?.claims?.sub) return;

  const { error } = await supabase.from("entries").delete().eq("id", id).in("kind", ["evento", "reunion"]);
  if (error) console.error("No se pudo eliminar el evento", error.message);
  revalidarAgenda();
}
