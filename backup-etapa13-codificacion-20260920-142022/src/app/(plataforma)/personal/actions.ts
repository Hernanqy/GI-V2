"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PersonalEstadoAccion = {
  ok: boolean;
  mensaje: string;
};

const noAutorizado: PersonalEstadoAccion = {
  ok: false,
  mensaje: "No tenÃ©s permisos para modificar este personal.",
};

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function valorNulo(valor: string) {
  return valor || null;
}

const estadosValidos = new Set(["activo", "licencia", "baja", "a_confirmar"]);

async function contextoGestion() {
  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = identidad?.claims?.sub;

  if (errorIdentidad || !userId) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, area_id")
    .eq("id", userId)
    .maybeSingle();

  if (!perfil) return null;

  return {
    supabase,
    db: supabase as any,
    rol: perfil.role,
    areaId: perfil.area_id,
  };
}

function puedeGestionar(
  contexto: { rol: string; areaId: string | null },
  areaId: string,
) {
  return contexto.rol === "coordinacion" || contexto.areaId === areaId;
}

async function espacioPerteneceAlArea(
  db: any,
  spaceId: string,
  areaId: string,
) {
  if (!spaceId) return true;

  const { data } = await db
    .from("spaces")
    .select("id")
    .eq("id", spaceId)
    .eq("area_id", areaId)
    .maybeSingle();

  return Boolean(data);
}

function revalidarPersonal() {
  revalidatePath("/personal");
  revalidatePath("/areas", "layout");
}

function mensajeError(codigo?: string) {
  if (codigo === "23503") return "La dependencia o el espacio seleccionado ya no existe.";
  if (codigo === "23514") return "Hay un dato que no cumple las opciones permitidas.";
  if (codigo === "42501") return "La base de datos rechazÃ³ la operaciÃ³n por permisos.";
  return "No se pudo guardar el cambio. IntentÃ¡ nuevamente.";
}

export async function crearPersonal(
  _estadoAnterior: PersonalEstadoAccion,
  formData: FormData,
): Promise<PersonalEstadoAccion> {
  const contexto = await contextoGestion();
  if (!contexto) return noAutorizado;

  const areaId = texto(formData, "area_id");
  const spaceId = texto(formData, "space_id");
  const nombre = texto(formData, "full_name");
  const legajo = texto(formData, "employee_number");
  const rol = texto(formData, "role_title");
  const tareas = texto(formData, "tasks");
  const tipoVinculo = texto(formData, "employment_type");
  const horas = texto(formData, "weekly_hours");
  const estado = texto(formData, "status") || "activo";
  const observaciones = texto(formData, "notes");

  if (!areaId || nombre.length < 2) {
    return { ok: false, mensaje: "CompletÃ¡ como mÃ­nimo nombre y dependencia." };
  }

  if (!puedeGestionar(contexto, areaId)) return noAutorizado;
  if (!estadosValidos.has(estado)) {
    return { ok: false, mensaje: "El estado seleccionado no es vÃ¡lido." };
  }

  if (!(await espacioPerteneceAlArea(contexto.db, spaceId, areaId))) {
    return { ok: false, mensaje: "El espacio elegido no pertenece a esa dependencia." };
  }

  const { error } = await contexto.db.from("staff").insert({
    area_id: areaId,
    space_id: valorNulo(spaceId),
    full_name: nombre,
    employee_number: valorNulo(legajo),
    role_title: valorNulo(rol),
    tasks: valorNulo(tareas),
    employment_type: valorNulo(tipoVinculo),
    weekly_hours: valorNulo(horas),
    status: estado,
    notes: valorNulo(observaciones),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("No se pudo crear personal", error.message);
    return { ok: false, mensaje: mensajeError(error.code) };
  }

  revalidarPersonal();
  return { ok: true, mensaje: "Persona agregada correctamente." };
}

export async function editarPersonal(
  _estadoAnterior: PersonalEstadoAccion,
  formData: FormData,
): Promise<PersonalEstadoAccion> {
  const contexto = await contextoGestion();
  if (!contexto) return noAutorizado;

  const id = texto(formData, "id");
  const areaId = texto(formData, "area_id");
  const spaceId = texto(formData, "space_id");
  const nombre = texto(formData, "full_name");
  const legajo = texto(formData, "employee_number");
  const rol = texto(formData, "role_title");
  const tareas = texto(formData, "tasks");
  const tipoVinculo = texto(formData, "employment_type");
  const horas = texto(formData, "weekly_hours");
  const estado = texto(formData, "status") || "activo";
  const observaciones = texto(formData, "notes");

  if (!id || !areaId || nombre.length < 2) {
    return { ok: false, mensaje: "RevisÃ¡ nombre y dependencia." };
  }

  if (!puedeGestionar(contexto, areaId)) return noAutorizado;
  if (!estadosValidos.has(estado)) {
    return { ok: false, mensaje: "El estado seleccionado no es vÃ¡lido." };
  }

  if (!(await espacioPerteneceAlArea(contexto.db, spaceId, areaId))) {
    return { ok: false, mensaje: "El espacio elegido no pertenece a esa dependencia." };
  }

  const { data: actual } = await contexto.db
    .from("staff")
    .select("id, area_id")
    .eq("id", id)
    .maybeSingle();

  if (!actual) return { ok: false, mensaje: "No se encontrÃ³ la persona." };
  if (!puedeGestionar(contexto, actual.area_id)) return noAutorizado;

  const { data, error } = await contexto.db
    .from("staff")
    .update({
      area_id: areaId,
      space_id: valorNulo(spaceId),
      full_name: nombre,
      employee_number: valorNulo(legajo),
      role_title: valorNulo(rol),
      tasks: valorNulo(tareas),
      employment_type: valorNulo(tipoVinculo),
      weekly_hours: valorNulo(horas),
      status: estado,
      notes: valorNulo(observaciones),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("No se pudo editar personal", error.message);
    return { ok: false, mensaje: mensajeError(error?.code) };
  }

  revalidarPersonal();
  return { ok: true, mensaje: "Ficha actualizada correctamente." };
}

export async function darDeBajaPersonal(
  _estadoAnterior: PersonalEstadoAccion,
  formData: FormData,
): Promise<PersonalEstadoAccion> {
  const contexto = await contextoGestion();
  if (!contexto) return noAutorizado;

  const id = texto(formData, "id");
  const areaId = texto(formData, "area_id");
  if (!id || !areaId) return { ok: false, mensaje: "No se pudo identificar la persona." };
  if (!puedeGestionar(contexto, areaId)) return noAutorizado;

  const { data, error } = await contexto.db
    .from("staff")
    .update({ status: "baja", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("area_id", areaId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("No se pudo dar de baja", error.message);
    return { ok: false, mensaje: mensajeError(error?.code) };
  }

  revalidarPersonal();
  return { ok: true, mensaje: "La persona quedÃ³ registrada como baja." };
}