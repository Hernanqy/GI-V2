"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const estadosPermitidos = new Set(["pendiente", "completado"]);
const prioridadesPermitidas = new Set<Database["public"]["Enums"]["priority_level"]>([
  "normal",
  "alta",
  "compromiso_prioritario",
]);

export type EditarSolicitudEstado = {
  ok: boolean;
  mensaje: string;
};

function leerTexto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

export async function actualizarEstadoSolicitud(formData: FormData) {
  const id = formData.get("id");
  const status = formData.get("status");

  if (typeof id !== "string" || typeof status !== "string" || !estadosPermitidos.has(status)) {
    return;
  }

  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = identidad?.claims?.sub;

  if (errorIdentidad || !userId) return;

  const { error } = await supabase
    .from("entries")
    .update({ status: status as "pendiente" | "completado", updated_by: userId })
    .eq("id", id)
    .eq("kind", "solicitud");

  if (error) console.error("No se pudo actualizar la solicitud", error.message);

  revalidatePath("/solicitudes");
}

export async function editarSolicitud(
  id: string,
  _estadoAnterior: EditarSolicitudEstado,
  formData: FormData,
): Promise<EditarSolicitudEstado> {
  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = identidad?.claims?.sub;

  if (errorIdentidad || !userId) {
    return { ok: false, mensaje: "La sesión venció. Volvé a ingresar." };
  }

  const areaId = leerTexto(formData, "area_id");
  const spaceId = leerTexto(formData, "space_id");
  const title = leerTexto(formData, "title");
  const details = leerTexto(formData, "details");
  const dueDate = leerTexto(formData, "due_date");
  const priority = leerTexto(formData, "priority") as Database["public"]["Enums"]["priority_level"];

  if (!id || !areaId || title.length < 3 || details.length < 3 || !prioridadesPermitidas.has(priority)) {
    return { ok: false, mensaje: "Revisá el área, el título, el detalle y la prioridad." };
  }

  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return { ok: false, mensaje: "La fecha ingresada no es válida." };
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
      title,
      details,
      area_id: areaId,
      space_id: spaceId || null,
      due_date: dueDate || null,
      priority,
      updated_by: userId,
    })
    .eq("id", id)
    .eq("kind", "solicitud")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("No se pudo editar la solicitud", error.message);
    return { ok: false, mensaje: "No se pudo guardar el cambio." };
  }

  revalidatePath("/solicitudes");
  revalidatePath(`/solicitudes/${id}/editar`);
  return { ok: true, mensaje: "Cambios guardados correctamente." };
}

export async function eliminarSolicitud(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  if (errorIdentidad || !identidad?.claims?.sub) return;

  const { error } = await supabase.from("entries").delete().eq("id", id).eq("kind", "solicitud");
  if (error) console.error("No se pudo eliminar la solicitud", error.message);

  revalidatePath("/solicitudes");
}
