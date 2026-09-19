import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type EntryKind = Database["public"]["Enums"]["entry_kind"];
type EntryStatus = Database["public"]["Enums"]["entry_status"];
type Priority = Database["public"]["Enums"]["priority_level"];

export type RegistroBitacora = {
  id: string;
  titulo: string;
  detalle: string;
  tipo: Extract<EntryKind, "evento" | "reunion" | "nota" | "actualizacion">;
  estado: EntryStatus;
  prioridad: Priority;
  areaId: string;
  area: string;
  espacio: string | null;
  fecha: string;
};

export async function obtenerRegistros(): Promise<RegistroBitacora[]> {
  const supabase = await createClient();
  const [notasResult, realizadosResult, areasResult, espaciosResult] = await Promise.all([
    supabase.from("entries").select("id, title, details, kind, status, priority, area_id, space_id, due_date, created_at").in("kind", ["nota", "actualizacion"]).neq("status", "cancelado"),
    supabase.from("entries").select("id, title, details, kind, status, priority, area_id, space_id, starts_at, created_at").in("kind", ["evento", "reunion"]).eq("status", "completado"),
    supabase.from("areas").select("id, name"),
    supabase.from("spaces").select("id, name"),
  ]);

  if (notasResult.error) throw new Error(`No se pudieron cargar las notas: ${notasResult.error.message}`);
  if (realizadosResult.error) throw new Error(`No se pudo cargar el historial: ${realizadosResult.error.message}`);

  const areas = new Map((areasResult.data ?? []).map((area) => [area.id, area.name]));
  const espacios = new Map((espaciosResult.data ?? []).map((espacio) => [espacio.id, espacio.name]));
  const notas: RegistroBitacora[] = (notasResult.data ?? []).flatMap((item) => {
    if (item.kind !== "nota" && item.kind !== "actualizacion") return [];
    return [{ id: item.id, titulo: item.title, detalle: item.details ?? "", tipo: item.kind, estado: item.status, prioridad: item.priority, areaId: item.area_id, area: areas.get(item.area_id) ?? "Área sin identificar", espacio: item.space_id ? espacios.get(item.space_id) ?? "Espacio sin identificar" : null, fecha: item.due_date ? `${item.due_date}T12:00:00-03:00` : item.created_at }];
  });
  const realizados: RegistroBitacora[] = (realizadosResult.data ?? []).flatMap((item) => {
    if (item.kind !== "evento" && item.kind !== "reunion") return [];
    return [{ id: item.id, titulo: item.title, detalle: item.details ?? "", tipo: item.kind, estado: item.status, prioridad: item.priority, areaId: item.area_id, area: areas.get(item.area_id) ?? "Área sin identificar", espacio: item.space_id ? espacios.get(item.space_id) ?? "Espacio sin identificar" : null, fecha: item.starts_at ?? item.created_at }];
  });

  return [...notas, ...realizados].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}
