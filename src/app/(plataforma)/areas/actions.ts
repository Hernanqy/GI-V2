"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DependenciaEstado = {
  ok: boolean;
  mensaje: string;
  eliminada?: boolean;
};

const estadoNoAutorizado: DependenciaEstado = {
  ok: false,
  mensaje: "No tenés permisos para modificar dependencias y espacios.",
};

function leerTexto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function crearSlug(valor: string) {
  const base = valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "dependencia";
}

async function contextoCoordinacion() {
  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = identidad?.claims?.sub;

  if (errorIdentidad || !userId) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (perfil?.role !== "coordinacion") return null;
  return { supabase, userId };
}

function revalidarEstructura(slug?: string) {
  revalidatePath("/");
  revalidatePath("/areas");
  revalidatePath("/registrar");
  revalidatePath("/agenda");
  revalidatePath("/eventos");
  revalidatePath("/solicitudes");
  revalidatePath("/registros");
  revalidatePath("/mapa");
  if (slug) revalidatePath(`/areas/${slug}`);
}

function mensajeErrorBase(codigo?: string) {
  if (codigo === "23505") return "Ya existe una dependencia o un espacio con ese nombre.";
  if (codigo === "23503") return "No se puede eliminar porque tiene información asociada.";
  if (codigo === "42501") return "La base de datos rechazó la operación por permisos.";
  return "No se pudo completar la operación. Intentá nuevamente.";
}

export async function crearDependencia(
  _estadoAnterior: DependenciaEstado,
  formData: FormData,
): Promise<DependenciaEstado> {
  const contexto = await contextoCoordinacion();
  if (!contexto) return estadoNoAutorizado;

  const name = leerTexto(formData, "name");
  const description = leerTexto(formData, "description");

  if (name.length < 3) {
    return { ok: false, mensaje: "El nombre de la dependencia debe tener al menos 3 caracteres." };
  }

  const baseSlug = crearSlug(name);
  const { data: slugsExistentes, error: errorSlugs } = await contexto.supabase
    .from("areas")
    .select("slug")
    .like("slug", `${baseSlug}%`);

  if (errorSlugs) {
    return { ok: false, mensaje: "No se pudo validar el nombre de la dependencia." };
  }

  const usados = new Set((slugsExistentes ?? []).map((item) => item.slug));
  let slug = baseSlug;
  let sufijo = 2;
  while (usados.has(slug)) {
    slug = `${baseSlug}-${sufijo}`;
    sufijo += 1;
  }

  const { error } = await contexto.supabase.from("areas").insert({
    slug,
    name,
    description: description || null,
    active: true,
  });

  if (error) {
    console.error("No se pudo crear la dependencia", error.message);
    return { ok: false, mensaje: mensajeErrorBase(error.code) };
  }

  revalidarEstructura();
  return { ok: true, mensaje: "Dependencia creada correctamente." };
}

export async function editarDependencia(
  _estadoAnterior: DependenciaEstado,
  formData: FormData,
): Promise<DependenciaEstado> {
  const contexto = await contextoCoordinacion();
  if (!contexto) return estadoNoAutorizado;

  const id = leerTexto(formData, "id");
  const slug = leerTexto(formData, "slug");
  const name = leerTexto(formData, "name");
  const description = leerTexto(formData, "description");

  if (!id || name.length < 3) {
    return { ok: false, mensaje: "Revisá el nombre de la dependencia." };
  }

  const { data, error } = await contexto.supabase
    .from("areas")
    .update({ name, description: description || null })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("No se pudo editar la dependencia", error.message);
    return { ok: false, mensaje: mensajeErrorBase(error?.code) };
  }

  revalidarEstructura(slug);
  return { ok: true, mensaje: "Dependencia actualizada correctamente." };
}

export async function eliminarDependencia(
  _estadoAnterior: DependenciaEstado,
  formData: FormData,
): Promise<DependenciaEstado> {
  const contexto = await contextoCoordinacion();
  if (!contexto) return estadoNoAutorizado;

  const id = leerTexto(formData, "id");
  const slug = leerTexto(formData, "slug");
  if (!id) return { ok: false, mensaje: "No se pudo identificar la dependencia." };

  const [espacios, entradas, perfiles] = await Promise.all([
    contexto.supabase.from("spaces").select("id", { count: "exact", head: true }).eq("area_id", id),
    contexto.supabase.from("entries").select("id", { count: "exact", head: true }).eq("area_id", id),
    contexto.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("area_id", id),
  ]);

  const errores = [espacios.error, entradas.error, perfiles.error].filter(Boolean);
  if (errores.length > 0) {
    return { ok: false, mensaje: "No se pudo comprobar si la dependencia tiene información asociada." };
  }

  const partes: string[] = [];
  if ((espacios.count ?? 0) > 0) partes.push(`${espacios.count} espacio${espacios.count === 1 ? "" : "s"}`);
  if ((entradas.count ?? 0) > 0) partes.push(`${entradas.count} registro${entradas.count === 1 ? "" : "s"}`);
  if ((perfiles.count ?? 0) > 0) partes.push(`${perfiles.count} usuario${perfiles.count === 1 ? "" : "s"}`);

  if (partes.length > 0) {
    return {
      ok: false,
      mensaje: `No se puede eliminar: tiene ${partes.join(", ")} asociados. Primero hay que resolver esas vinculaciones.`,
    };
  }

  const { error } = await contexto.supabase.from("areas").delete().eq("id", id);
  if (error) {
    console.error("No se pudo eliminar la dependencia", error.message);
    return { ok: false, mensaje: mensajeErrorBase(error.code) };
  }

  revalidarEstructura(slug);
  return { ok: true, mensaje: "Dependencia eliminada.", eliminada: true };
}

export async function crearEspacio(
  _estadoAnterior: DependenciaEstado,
  formData: FormData,
): Promise<DependenciaEstado> {
  const contexto = await contextoCoordinacion();
  if (!contexto) return estadoNoAutorizado;

  const areaId = leerTexto(formData, "area_id");
  const slug = leerTexto(formData, "slug");
  const name = leerTexto(formData, "name");
  const spaceType = leerTexto(formData, "space_type");
  const locality = leerTexto(formData, "locality");
  const address = leerTexto(formData, "address");

  if (!areaId || name.length < 2) {
    return { ok: false, mensaje: "Ingresá un nombre válido para el espacio." };
  }

  const { data: area } = await contexto.supabase
    .from("areas")
    .select("id")
    .eq("id", areaId)
    .eq("active", true)
    .maybeSingle();

  if (!area) return { ok: false, mensaje: "La dependencia seleccionada ya no está disponible." };

  const { error } = await contexto.supabase.from("spaces").insert({
    area_id: areaId,
    name,
    space_type: spaceType || null,
    locality: locality || null,
    address: address || null,
    active: true,
  });

  if (error) {
    console.error("No se pudo crear el espacio", error.message);
    return { ok: false, mensaje: mensajeErrorBase(error.code) };
  }

  revalidarEstructura(slug);
  return { ok: true, mensaje: "Espacio agregado correctamente." };
}

export async function editarEspacio(
  _estadoAnterior: DependenciaEstado,
  formData: FormData,
): Promise<DependenciaEstado> {
  const contexto = await contextoCoordinacion();
  if (!contexto) return estadoNoAutorizado;

  const id = leerTexto(formData, "id");
  const areaId = leerTexto(formData, "area_id");
  const slug = leerTexto(formData, "slug");
  const name = leerTexto(formData, "name");
  const spaceType = leerTexto(formData, "space_type");
  const locality = leerTexto(formData, "locality");
  const address = leerTexto(formData, "address");

  if (!id || !areaId || name.length < 2) {
    return { ok: false, mensaje: "Revisá los datos del espacio." };
  }

  const { data, error } = await contexto.supabase
    .from("spaces")
    .update({
      name,
      space_type: spaceType || null,
      locality: locality || null,
      address: address || null,
    })
    .eq("id", id)
    .eq("area_id", areaId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("No se pudo editar el espacio", error.message);
    return { ok: false, mensaje: mensajeErrorBase(error?.code) };
  }

  revalidarEstructura(slug);
  return { ok: true, mensaje: "Espacio actualizado correctamente." };
}

export async function eliminarEspacio(
  _estadoAnterior: DependenciaEstado,
  formData: FormData,
): Promise<DependenciaEstado> {
  const contexto = await contextoCoordinacion();
  if (!contexto) return estadoNoAutorizado;

  const id = leerTexto(formData, "id");
  const areaId = leerTexto(formData, "area_id");
  const slug = leerTexto(formData, "slug");

  if (!id || !areaId) return { ok: false, mensaje: "No se pudo identificar el espacio." };

  const { count, error: errorConteo } = await contexto.supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("space_id", id);

  if (errorConteo) {
    return { ok: false, mensaje: "No se pudo comprobar si el espacio tiene registros asociados." };
  }

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      mensaje: `No se puede eliminar: el espacio está usado en ${count} registro${count === 1 ? "" : "s"}. Así se preserva el historial institucional.`,
    };
  }

  const { error } = await contexto.supabase
    .from("spaces")
    .delete()
    .eq("id", id)
    .eq("area_id", areaId);

  if (error) {
    console.error("No se pudo eliminar el espacio", error.message);
    return { ok: false, mensaje: mensajeErrorBase(error.code) };
  }

  revalidarEstructura(slug);
  return { ok: true, mensaje: "Espacio eliminado correctamente." };
}
