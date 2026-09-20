"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DirectVenueState = {
  ok: boolean;
  mensaje: string;
};

const inicial: DirectVenueState = { ok: false, mensaje: "" };

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function valorNulo(valor: string) {
  return valor || null;
}

const estadosValidos = new Set([
  "activo",
  "cerrado_temporalmente",
  "en_refaccion",
  "a_confirmar",
]);

export async function guardarEspacioDirecto(
  _estadoAnterior: DirectVenueState = inicial,
  formData: FormData,
): Promise<DirectVenueState> {
  const spaceId = texto(formData, "space_id");
  const areaId = texto(formData, "area_id");
  const slug = texto(formData, "slug");
  const nombre = texto(formData, "name");
  const tipo = texto(formData, "space_type");
  const localidad = texto(formData, "locality");
  const direccion = texto(formData, "address");
  const responsable = texto(formData, "responsible_name");
  const horarios = texto(formData, "opening_hours");
  const contacto = texto(formData, "public_contact");
  const estado = texto(formData, "operational_status") || "a_confirmar";
  const notas = texto(formData, "management_notes");

  if (!spaceId || !areaId || !slug || !nombre) {
    return { ok: false, mensaje: "Faltan datos para guardar la ficha." };
  }

  if (!estadosValidos.has(estado)) {
    return { ok: false, mensaje: "El estado operativo no es válido." };
  }

  const supabase = await createClient();
  const db = supabase as any;

  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = (identidad?.claims as any)?.sub;

  if (errorIdentidad || !userId) {
    return { ok: false, mensaje: "La sesión no es válida." };
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, area_id")
    .eq("id", userId)
    .maybeSingle();

  const puedeEditar =
    perfil?.role === "coordinacion" ||
    (perfil?.role === "responsable_area" && perfil?.area_id === areaId);

  if (!puedeEditar) {
    return { ok: false, mensaje: "No tenés permisos para editar este espacio." };
  }

  const { data, error } = await db
    .from("spaces")
    .update({
      name: nombre,
      space_type: valorNulo(tipo),
      locality: valorNulo(localidad),
      address: valorNulo(direccion),
      responsible_name: valorNulo(responsable),
      opening_hours: valorNulo(horarios),
      public_contact: valorNulo(contacto),
      operational_status: estado,
      management_notes: valorNulo(notas),
      updated_at: new Date().toISOString(),
    })
    .eq("id", spaceId)
    .eq("area_id", areaId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("No se pudo guardar el espacio directo", error?.message);
    return { ok: false, mensaje: "No se pudieron guardar los cambios." };
  }

  revalidatePath(`/areas/${slug}`);
  revalidatePath("/areas");
  return { ok: true, mensaje: "Ficha del espacio actualizada." };
}