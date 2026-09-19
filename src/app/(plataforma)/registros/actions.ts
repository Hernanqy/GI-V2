"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Priority = Database["public"]["Enums"]["priority_level"];
export type EditarRegistroEstado = { ok: boolean; mensaje: string };

const tiposPermitidos = new Set(["nota", "actualizacion"]);
const prioridadesPermitidas = new Set<Priority>(["normal", "alta", "compromiso_prioritario"]);

function leerTexto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function revalidarRegistros() {
  revalidatePath("/");
  revalidatePath("/registros");
}

export async function editarRegistro(id: string, _estadoAnterior: EditarRegistroEstado, formData: FormData): Promise<EditarRegistroEstado> {
  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = identidad?.claims?.sub;
  if (errorIdentidad || !userId) return { ok: false, mensaje: "La sesión venció. Volvé a ingresar." };

  const kind = leerTexto(formData, "kind");
  const areaId = leerTexto(formData, "area_id");
  const spaceId = leerTexto(formData, "space_id");
  const title = leerTexto(formData, "title");
  const details = leerTexto(formData, "details");
  const dueDate = leerTexto(formData, "due_date");
  const priority = leerTexto(formData, "priority") as Priority;

  if (!tiposPermitidos.has(kind) || !areaId || title.length < 3 || details.length < 3 || !prioridadesPermitidas.has(priority)) return { ok: false, mensaje: "Revisá los datos obligatorios." };
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return { ok: false, mensaje: "La fecha ingresada no es válida." };

  const { data: area } = await supabase.from("areas").select("id").eq("id", areaId).eq("active", true).maybeSingle();
  if (!area) return { ok: false, mensaje: "El área seleccionada no está disponible." };
  if (spaceId) {
    const { data: espacio } = await supabase.from("spaces").select("id").eq("id", spaceId).eq("area_id", areaId).eq("active", true).maybeSingle();
    if (!espacio) return { ok: false, mensaje: "El espacio no corresponde al área elegida." };
  }

  const { data, error } = await supabase.from("entries").update({ kind: kind as "nota" | "actualizacion", title, details, area_id: areaId, space_id: spaceId || null, due_date: dueDate || null, priority, updated_by: userId }).eq("id", id).in("kind", ["nota", "actualizacion"]).select("id").maybeSingle();
  if (error || !data) {
    if (error) console.error("No se pudo editar el registro", error.message);
    return { ok: false, mensaje: "No se pudieron guardar los cambios." };
  }
  revalidarRegistros();
  revalidatePath(`/registros/${id}/editar`);
  return { ok: true, mensaje: "Registro actualizado correctamente." };
}

export async function eliminarRegistro(formData: FormData) {
  const id = leerTexto(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  if (errorIdentidad || !identidad?.claims?.sub) return;
  const { error } = await supabase.from("entries").delete().eq("id", id).in("kind", ["nota", "actualizacion"]);
  if (error) console.error("No se pudo eliminar el registro", error.message);
  revalidarRegistros();
}
