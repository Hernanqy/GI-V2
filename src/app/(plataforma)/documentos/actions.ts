"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DocumentActionState = {
  ok: boolean;
  mensaje: string;
};

const estadosValidos = new Set([
  "vigente",
  "pendiente_revision",
  "historico",
  "referencia_anual",
]);

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function valorNulo(valor: string) {
  return valor || null;
}

function urlValida(valor: string) {
  if (!valor) return true;
  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function contextoGestion() {
  const supabase = await createClient();
  const db = supabase as any;
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = (identidad?.claims as any)?.sub;

  if (errorIdentidad || !userId) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, area_id")
    .eq("id", userId)
    .maybeSingle();

  if (!perfil) return null;

  return {
    supabase,
    db,
    userId,
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

async function espacioPerteneceAlArea(db: any, spaceId: string, areaId: string) {
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

function leerDocumento(formData: FormData) {
  return {
    areaId: texto(formData, "area_id"),
    spaceId: texto(formData, "space_id"),
    titulo: texto(formData, "title"),
    tipo: texto(formData, "document_type"),
    fuente: texto(formData, "source_name"),
    url: texto(formData, "external_url"),
    responsable: texto(formData, "responsible_name"),
    vigenteDesde: texto(formData, "valid_from"),
    vigenteHasta: texto(formData, "valid_until"),
    estado: texto(formData, "status") || "pendiente_revision",
    notas: texto(formData, "notes"),
  };
}

function validarDocumento(doc: ReturnType<typeof leerDocumento>) {
  if (doc.titulo.length < 2) return "Completá el título del documento.";
  if (!estadosValidos.has(doc.estado)) return "El estado del documento no es válido.";
  if (!urlValida(doc.url)) return "El enlace debe comenzar con http:// o https://.";
  if (doc.vigenteDesde && doc.vigenteHasta && doc.vigenteHasta < doc.vigenteDesde) {
    return "La fecha de vencimiento no puede ser anterior a la fecha de inicio.";
  }
  return "";
}

export async function crearDocumento(
  _estadoAnterior: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const contexto = await contextoGestion();
  if (!contexto) return { ok: false, mensaje: "La sesión no es válida." };

  const doc = leerDocumento(formData);
  const errorValidacion = validarDocumento(doc);
  if (errorValidacion) return { ok: false, mensaje: errorValidacion };

  if (!puedeGestionar(contexto, doc.areaId)) {
    return { ok: false, mensaje: "No tenés permisos para crear este documento." };
  }

  if (!(await espacioPerteneceAlArea(contexto.db, doc.spaceId, doc.areaId))) {
    return { ok: false, mensaje: "El espacio seleccionado no pertenece a la dependencia." };
  }

  const { error } = await contexto.db.from("documents").insert({
    area_id: valorNulo(doc.areaId),
    space_id: valorNulo(doc.spaceId),
    title: doc.titulo,
    document_type: valorNulo(doc.tipo),
    source_name: valorNulo(doc.fuente),
    external_url: valorNulo(doc.url),
    responsible_name: valorNulo(doc.responsable),
    valid_from: valorNulo(doc.vigenteDesde),
    valid_until: valorNulo(doc.vigenteHasta),
    status: doc.estado,
    notes: valorNulo(doc.notas),
    created_by: contexto.userId,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("No se pudo crear el documento", error.message);
    return { ok: false, mensaje: "No se pudo guardar el documento." };
  }

  revalidatePath("/documentos");
  return { ok: true, mensaje: "Documento agregado correctamente." };
}

export async function editarDocumento(
  _estadoAnterior: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const contexto = await contextoGestion();
  if (!contexto) return { ok: false, mensaje: "La sesión no es válida." };

  const id = texto(formData, "id");
  const doc = leerDocumento(formData);
  const errorValidacion = validarDocumento(doc);

  if (!id) return { ok: false, mensaje: "No se pudo identificar el documento." };
  if (errorValidacion) return { ok: false, mensaje: errorValidacion };

  const { data: actual } = await contexto.db
    .from("documents")
    .select("id, area_id")
    .eq("id", id)
    .maybeSingle();

  if (!actual) return { ok: false, mensaje: "El documento ya no existe." };
  if (!puedeGestionar(contexto, actual.area_id ?? "")) {
    return { ok: false, mensaje: "No tenés permisos para editar este documento." };
  }
  if (!puedeGestionar(contexto, doc.areaId)) {
    return { ok: false, mensaje: "No podés mover el documento a esa dependencia." };
  }

  if (!(await espacioPerteneceAlArea(contexto.db, doc.spaceId, doc.areaId))) {
    return { ok: false, mensaje: "El espacio seleccionado no pertenece a la dependencia." };
  }

  const { error } = await contexto.db
    .from("documents")
    .update({
      area_id: valorNulo(doc.areaId),
      space_id: valorNulo(doc.spaceId),
      title: doc.titulo,
      document_type: valorNulo(doc.tipo),
      source_name: valorNulo(doc.fuente),
      external_url: valorNulo(doc.url),
      responsible_name: valorNulo(doc.responsable),
      valid_from: valorNulo(doc.vigenteDesde),
      valid_until: valorNulo(doc.vigenteHasta),
      status: doc.estado,
      notes: valorNulo(doc.notas),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("No se pudo editar el documento", error.message);
    return { ok: false, mensaje: "No se pudieron guardar los cambios." };
  }

  revalidatePath("/documentos");
  return { ok: true, mensaje: "Documento actualizado." };
}

export async function archivarDocumento(
  _estadoAnterior: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const contexto = await contextoGestion();
  if (!contexto) return { ok: false, mensaje: "La sesión no es válida." };

  const id = texto(formData, "id");

  const { data: actual } = await contexto.db
    .from("documents")
    .select("id, area_id")
    .eq("id", id)
    .maybeSingle();

  if (!actual) return { ok: false, mensaje: "El documento ya no existe." };
  if (!puedeGestionar(contexto, actual.area_id ?? "")) {
    return { ok: false, mensaje: "No tenés permisos para archivar este documento." };
  }

  const { error } = await contexto.db
    .from("documents")
    .update({
      status: "historico",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, mensaje: "No se pudo archivar el documento." };

  revalidatePath("/documentos");
  return { ok: true, mensaje: "Documento enviado a Histórico." };
}