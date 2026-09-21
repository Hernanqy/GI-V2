"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MapState = {
  ok: boolean;
  mensaje: string;
};

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function numero(valor: string) {
  if (!valor) return null;
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function guardarUbicacion(
  _estadoAnterior: MapState,
  formData: FormData,
): Promise<MapState> {
  const id = texto(formData, "id");
  const areaId = texto(formData, "area_id");
  const localidad = texto(formData, "locality");
  const direccion = texto(formData, "address");
  const latitud = numero(texto(formData, "latitude"));
  const longitud = numero(texto(formData, "longitude"));
  const validar = texto(formData, "validate_location") === "true";

  if (!id || !areaId) {
    return { ok: false, mensaje: "No se pudo identificar el espacio." };
  }

  if (latitud === null || longitud === null) {
    return {
      ok: false,
      mensaje: "Primero seleccioná una ubicación en el mapa.",
    };
  }

  const supabase = await createClient();

  const { data: identidad } = await supabase.auth.getClaims();
  const userId = identidad?.claims?.sub;

  if (!userId) {
    return { ok: false, mensaje: "La sesión no es válida." };
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, area_id")
    .eq("id", userId)
    .maybeSingle();

  const autorizado =
    perfil?.role === "coordinacion" ||
    (perfil?.role === "responsable_area" && perfil.area_id === areaId);

  if (!autorizado) {
    return {
      ok: false,
      mensaje: "No tenés permisos para modificar este espacio.",
    };
  }

  const db = supabase as any;

  const { error } = await db
    .from("spaces")
    .update({
      locality: localidad || null,
      address: direccion || null,
      latitude: latitud,
      longitude: longitud,
      location_validated: validar,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("area_id", areaId);

  if (error) {
    console.error(error);
    return { ok: false, mensaje: "No se pudo guardar la ubicación." };
  }

  revalidatePath("/mapa");
  revalidatePath("/areas", "layout");

  return {
    ok: true,
    mensaje: validar
      ? "Ubicación guardada y validada."
      : "Ubicación guardada. Falta validarla.",
  };
}