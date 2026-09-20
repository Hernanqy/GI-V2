import { createClient } from "@/lib/supabase/server";

export type DocumentoInstitucional = {
  id: string;
  areaId: string | null;
  spaceId: string | null;
  titulo: string;
  tipo: string;
  fuente: string;
  url: string;
  responsable: string;
  vigenteDesde: string;
  vigenteHasta: string;
  estado: "vigente" | "pendiente_revision" | "historico" | "referencia_anual";
  notas: string;
  creado: string;
  actualizado: string;
};

export async function obtenerDocumentos(): Promise<DocumentoInstitucional[]> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data, error } = await db
    .from("documents")
    .select(
      "id, area_id, space_id, title, document_type, source_name, external_url, responsible_name, valid_from, valid_until, status, notes, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("No se pudieron cargar los documentos", error.message);
    return [];
  }

  return (data ?? []).map((item: any) => ({
    id: item.id,
    areaId: item.area_id,
    spaceId: item.space_id,
    titulo: item.title,
    tipo: item.document_type ?? "",
    fuente: item.source_name ?? "",
    url: item.external_url ?? "",
    responsable: item.responsible_name ?? "",
    vigenteDesde: item.valid_from ?? "",
    vigenteHasta: item.valid_until ?? "",
    estado: item.status,
    notas: item.notes ?? "",
    creado: item.created_at,
    actualizado: item.updated_at,
  }));
}