"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PersonalEstadoAccion = {
  ok: boolean;
  mensaje: string;
};

const noAutorizado: PersonalEstadoAccion = {
  ok: false,
  mensaje: "No tenés permisos para realizar este cambio.",
};

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function valorNulo(valor: string) {
  return valor || null;
}

function numeroNulo(valor: string) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
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
  if (!areaId) return contexto.rol === "coordinacion";
  return contexto.rol === "coordinacion" || contexto.areaId === areaId;
}

async function espacioPerteneceAlArea(
  db: any,
  spaceId: string,
  areaId: string,
) {
  if (!spaceId) return true;
  if (!areaId) return false;

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
  if (codigo === "23503") return "La dependencia, el espacio o la persona ya no existe.";
  if (codigo === "23514") return "Hay un dato que no cumple las opciones permitidas.";
  if (codigo === "42501") return "La base de datos rechazó la operación por permisos.";
  return "No se pudo guardar el cambio. Intentá nuevamente.";
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
  const anioIngreso = texto(formData, "start_year");
  const categoria = texto(formData, "category");
  const vencimiento = texto(formData, "contract_expires");

  if (nombre.length < 2) {
    return { ok: false, mensaje: "Completá el nombre y apellido." };
  }

  if (!puedeGestionar(contexto, areaId)) return noAutorizado;
  if (!estadosValidos.has(estado)) {
    return { ok: false, mensaje: "El estado seleccionado no es válido." };
  }

  if (!(await espacioPerteneceAlArea(contexto.db, spaceId, areaId))) {
    return { ok: false, mensaje: "El espacio elegido no pertenece a esa dependencia." };
  }

  const { data: persona, error } = await contexto.db
    .from("staff")
    .insert({
      area_id: valorNulo(areaId),
      space_id: valorNulo(spaceId),
      full_name: nombre,
      employee_number: valorNulo(legajo),
      role_title: valorNulo(rol),
      tasks: valorNulo(tareas),
      employment_type: valorNulo(tipoVinculo),
      weekly_hours: valorNulo(horas),
      status: estado,
      notes: valorNulo(observaciones),
      start_year: numeroNulo(anioIngreso),
      category: valorNulo(categoria),
      contract_expires: valorNulo(vencimiento),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !persona) {
    if (error) console.error("No se pudo crear personal", error.message);
    return { ok: false, mensaje: mensajeError(error?.code) };
  }

  const { error: errorAsignacion } = await contexto.db.from("staff_assignments").insert({
    staff_id: persona.id,
    area_id: valorNulo(areaId),
    space_id: valorNulo(spaceId),
    role_title: valorNulo(rol),
    weekly_hours: valorNulo(horas),
    employment_type: valorNulo(tipoVinculo),
    start_year: numeroNulo(anioIngreso),
    category: valorNulo(categoria),
    tasks: valorNulo(tareas),
    contract_expires: valorNulo(vencimiento),
    notes: valorNulo(observaciones),
    active: estado !== "baja",
    updated_at: new Date().toISOString(),
  });

  if (errorAsignacion) {
    console.error("La persona se creó, pero no la asignación inicial", errorAsignacion.message);
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
  const anioIngreso = texto(formData, "start_year");
  const categoria = texto(formData, "category");
  const vencimiento = texto(formData, "contract_expires");

  if (!id || nombre.length < 2) {
    return { ok: false, mensaje: "Revisá el nombre y apellido." };
  }

  if (!puedeGestionar(contexto, areaId)) return noAutorizado;
  if (!estadosValidos.has(estado)) {
    return { ok: false, mensaje: "El estado seleccionado no es válido." };
  }

  if (!(await espacioPerteneceAlArea(contexto.db, spaceId, areaId))) {
    return { ok: false, mensaje: "El espacio elegido no pertenece a esa dependencia." };
  }

  const { data: actual } = await contexto.db
    .from("staff")
    .select("id, area_id")
    .eq("id", id)
    .maybeSingle();

  if (!actual) return { ok: false, mensaje: "No se encontró la persona." };
  if (!puedeGestionar(contexto, actual.area_id ?? "")) return noAutorizado;

  const { data, error } = await contexto.db
    .from("staff")
    .update({
      area_id: valorNulo(areaId),
      space_id: valorNulo(spaceId),
      full_name: nombre,
      employee_number: valorNulo(legajo),
      role_title: valorNulo(rol),
      tasks: valorNulo(tareas),
      employment_type: valorNulo(tipoVinculo),
      weekly_hours: valorNulo(horas),
      status: estado,
      notes: valorNulo(observaciones),
      start_year: numeroNulo(anioIngreso),
      category: valorNulo(categoria),
      contract_expires: valorNulo(vencimiento),
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
  return { ok: true, mensaje: "Ficha principal actualizada." };
}

export async function darDeBajaPersonal(
  _estadoAnterior: PersonalEstadoAccion,
  formData: FormData,
): Promise<PersonalEstadoAccion> {
  const contexto = await contextoGestion();
  if (!contexto) return noAutorizado;

  const id = texto(formData, "id");

  const { data: actual } = await contexto.db
    .from("staff")
    .select("id, area_id")
    .eq("id", id)
    .maybeSingle();

  if (!actual) return { ok: false, mensaje: "No se encontró la persona." };
  if (!puedeGestionar(contexto, actual.area_id ?? "")) return noAutorizado;

  const { error } = await contexto.db
    .from("staff")
    .update({ status: "baja", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, mensaje: mensajeError(error.code) };

  revalidarPersonal();
  return { ok: true, mensaje: "La persona quedó registrada como baja." };
}

export async function crearAsignacion(
  _estadoAnterior: PersonalEstadoAccion,
  formData: FormData,
): Promise<PersonalEstadoAccion> {
  const contexto = await contextoGestion();
  if (!contexto) return noAutorizado;

  const staffId = texto(formData, "staff_id");
  const areaId = texto(formData, "area_id");
  const spaceId = texto(formData, "space_id");
  const rol = texto(formData, "role_title");
  const horas = texto(formData, "weekly_hours");
  const tipoVinculo = texto(formData, "employment_type");
  const anioIngreso = texto(formData, "start_year");
  const categoria = texto(formData, "category");
  const tareas = texto(formData, "tasks");
  const vencimiento = texto(formData, "contract_expires");
  const observaciones = texto(formData, "notes");

  if (!staffId) return { ok: false, mensaje: "No se pudo identificar la persona." };
  if (!puedeGestionar(contexto, areaId)) return noAutorizado;

  if (!(await espacioPerteneceAlArea(contexto.db, spaceId, areaId))) {
    return { ok: false, mensaje: "El espacio elegido no pertenece a esa dependencia." };
  }

  const { error } = await contexto.db.from("staff_assignments").insert({
    staff_id: staffId,
    area_id: valorNulo(areaId),
    space_id: valorNulo(spaceId),
    role_title: valorNulo(rol),
    weekly_hours: valorNulo(horas),
    employment_type: valorNulo(tipoVinculo),
    start_year: numeroNulo(anioIngreso),
    category: valorNulo(categoria),
    tasks: valorNulo(tareas),
    contract_expires: valorNulo(vencimiento),
    notes: valorNulo(observaciones),
    active: true,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("No se pudo crear asignación", error.message);
    return { ok: false, mensaje: mensajeError(error.code) };
  }

  revalidarPersonal();
  return { ok: true, mensaje: "Asignación agregada." };
}

export async function editarAsignacion(
  _estadoAnterior: PersonalEstadoAccion,
  formData: FormData,
): Promise<PersonalEstadoAccion> {
  const contexto = await contextoGestion();
  if (!contexto) return noAutorizado;

  const id = texto(formData, "assignment_id");
  const areaId = texto(formData, "area_id");
  const spaceId = texto(formData, "space_id");
  const rol = texto(formData, "role_title");
  const horas = texto(formData, "weekly_hours");
  const tipoVinculo = texto(formData, "employment_type");
  const anioIngreso = texto(formData, "start_year");
  const categoria = texto(formData, "category");
  const tareas = texto(formData, "tasks");
  const vencimiento = texto(formData, "contract_expires");
  const observaciones = texto(formData, "notes");

  const { data: actual } = await contexto.db
    .from("staff_assignments")
    .select("id, area_id")
    .eq("id", id)
    .maybeSingle();

  if (!actual) return { ok: false, mensaje: "No se encontró la asignación." };
  if (!puedeGestionar(contexto, actual.area_id ?? "")) return noAutorizado;
  if (!puedeGestionar(contexto, areaId)) return noAutorizado;

  if (!(await espacioPerteneceAlArea(contexto.db, spaceId, areaId))) {
    return { ok: false, mensaje: "El espacio elegido no pertenece a esa dependencia." };
  }

  const { error } = await contexto.db
    .from("staff_assignments")
    .update({
      area_id: valorNulo(areaId),
      space_id: valorNulo(spaceId),
      role_title: valorNulo(rol),
      weekly_hours: valorNulo(horas),
      employment_type: valorNulo(tipoVinculo),
      start_year: numeroNulo(anioIngreso),
      category: valorNulo(categoria),
      tasks: valorNulo(tareas),
      contract_expires: valorNulo(vencimiento),
      notes: valorNulo(observaciones),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, mensaje: mensajeError(error.code) };

  revalidarPersonal();
  return { ok: true, mensaje: "Asignación actualizada." };
}

export async function desactivarAsignacion(
  _estadoAnterior: PersonalEstadoAccion,
  formData: FormData,
): Promise<PersonalEstadoAccion> {
  const contexto = await contextoGestion();
  if (!contexto) return noAutorizado;

  const id = texto(formData, "assignment_id");

  const { data: actual } = await contexto.db
    .from("staff_assignments")
    .select("id, area_id")
    .eq("id", id)
    .maybeSingle();

  if (!actual) return { ok: false, mensaje: "No se encontró la asignación." };
  if (!puedeGestionar(contexto, actual.area_id ?? "")) return noAutorizado;

  const { error } = await contexto.db
    .from("staff_assignments")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, mensaje: mensajeError(error.code) };

  revalidarPersonal();
  return { ok: true, mensaje: "Asignación archivada." };
}