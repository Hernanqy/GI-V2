"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AreaExecutiveState = { ok: boolean; mensaje: string };
const inicial: AreaExecutiveState = { ok: false, mensaje: "" };

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

export async function guardarFichaEjecutiva(
  _estadoAnterior: AreaExecutiveState = inicial,
  formData: FormData,
): Promise<AreaExecutiveState> {
  const areaId = texto(formData, "area_id");
  if (!areaId) return { ok: false, mensaje: "No se pudo identificar la dependencia." };

  const supabase = await createClient();
  const db = supabase as any;
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = (identidad?.claims as any)?.sub;
  if (errorIdentidad || !userId) return { ok: false, mensaje: "La sesión no es válida." };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, area_id")
    .eq("id", userId)
    .maybeSingle();

  const puedeEditar =
    perfil?.role === "coordinacion" ||
    (perfil?.role === "responsable_area" && perfil?.area_id === areaId);

  if (!puedeEditar) return { ok: false, mensaje: "No tenés permisos para editar esta dependencia." };

  const { error } = await db
    .from("areas")
    .update({
      written_agenda: texto(formData, "written_agenda") || null,
      management_summary: texto(formData, "management_summary") || null,
      management_needs: texto(formData, "management_needs") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", areaId);

  if (error) return { ok: false, mensaje: "No se pudieron guardar los cambios." };

  revalidatePath("/areas", "layout");
  return { ok: true, mensaje: "Ficha ejecutiva actualizada." };
}