import { createClient } from "@/lib/supabase/server";

export type EstadoPersonal = "activo" | "licencia" | "baja" | "a_confirmar";

export type PersonalCultural = {
  id: string;
  areaId: string;
  spaceId: string | null;
  nombre: string;
  legajo: string;
  rol: string;
  tareas: string;
  tipoVinculo: string;
  horas: string;
  estado: EstadoPersonal;
  observaciones: string;
};

export async function obtenerPersonal(areaId?: string): Promise<PersonalCultural[]> {
  const supabase = await createClient();
  const db = supabase as any;

  let consulta = db
    .from("staff")
    .select("id, area_id, space_id, full_name, employee_number, role_title, tasks, employment_type, weekly_hours, status, notes")
    .order("full_name", { ascending: true });

  if (areaId) consulta = consulta.eq("area_id", areaId);

  const { data, error } = await consulta;

  if (error) {
    console.error("No se pudo cargar el personal", error.message);
    return [];
  }

  return (data ?? []).map((item: any) => ({
    id: item.id,
    areaId: item.area_id,
    spaceId: item.space_id,
    nombre: item.full_name,
    legajo: item.employee_number ?? "",
    rol: item.role_title ?? "",
    tareas: item.tasks ?? "",
    tipoVinculo: item.employment_type ?? "",
    horas: item.weekly_hours ?? "",
    estado: item.status as EstadoPersonal,
    observaciones: item.notes ?? "",
  }));
}