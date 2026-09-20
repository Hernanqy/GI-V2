import { createClient } from "@/lib/supabase/server";

export type EstadoPersonal = "activo" | "licencia" | "baja" | "a_confirmar";

export type AsignacionPersonal = {
  id: string;
  staffId: string;
  areaId: string | null;
  spaceId: string | null;
  rol: string;
  horas: string;
  tipoVinculo: string;
  anioIngreso: number | null;
  categoria: string;
  tareas: string;
  vencimiento: string;
  areaFuente: string;
  espacioFuente: string;
  vencimientoFuente: string;
  actualizadoFuente: string;
  observaciones: string;
  activa: boolean;
};

export type PersonalCultural = {
  id: string;
  areaId: string | null;
  spaceId: string | null;
  nombre: string;
  legajo: string;
  rol: string;
  tareas: string;
  tipoVinculo: string;
  horas: string;
  estado: EstadoPersonal;
  observaciones: string;
  anioIngreso: number | null;
  categoria: string;
  vencimiento: string;
  areaFuente: string;
  espacioFuente: string;
  vencimientoFuente: string;
  actualizadoFuente: string;
  asignaciones: AsignacionPersonal[];
};

export async function obtenerPersonal(areaId?: string): Promise<PersonalCultural[]> {
  const supabase = await createClient();
  const db = supabase as any;

  const [{ data: personas, error: errorPersonas }, { data: asignaciones, error: errorAsignaciones }] =
    await Promise.all([
      db
        .from("staff")
        .select(
          "id, area_id, space_id, full_name, employee_number, role_title, tasks, employment_type, weekly_hours, status, notes, start_year, category, contract_expires, source_area, source_space, source_expires_text, source_updated_at",
        )
        .order("full_name", { ascending: true }),
      db
        .from("staff_assignments")
        .select(
          "id, staff_id, area_id, space_id, role_title, weekly_hours, employment_type, start_year, category, tasks, contract_expires, source_area, source_space, source_expires_text, source_updated_at, notes, active",
        )
        .order("created_at", { ascending: true }),
    ]);

  if (errorPersonas) {
    console.error("No se pudo cargar el personal", errorPersonas.message);
    return [];
  }

  if (errorAsignaciones) {
    console.error("No se pudieron cargar las asignaciones", errorAsignaciones.message);
  }

  const asignacionesPorPersona = new Map<string, AsignacionPersonal[]>();

  for (const item of asignaciones ?? []) {
    const asignacion: AsignacionPersonal = {
      id: item.id,
      staffId: item.staff_id,
      areaId: item.area_id,
      spaceId: item.space_id,
      rol: item.role_title ?? "",
      horas: item.weekly_hours ?? "",
      tipoVinculo: item.employment_type ?? "",
      anioIngreso: item.start_year ?? null,
      categoria: item.category ?? "",
      tareas: item.tasks ?? "",
      vencimiento: item.contract_expires ?? "",
      areaFuente: item.source_area ?? "",
      espacioFuente: item.source_space ?? "",
      vencimientoFuente: item.source_expires_text ?? "",
      actualizadoFuente: item.source_updated_at ?? "",
      observaciones: item.notes ?? "",
      activa: item.active !== false,
    };

    const lista = asignacionesPorPersona.get(item.staff_id) ?? [];
    lista.push(asignacion);
    asignacionesPorPersona.set(item.staff_id, lista);
  }

  let resultado: PersonalCultural[] = (personas ?? []).map((item: any) => ({
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
    anioIngreso: item.start_year ?? null,
    categoria: item.category ?? "",
    vencimiento: item.contract_expires ?? "",
    areaFuente: item.source_area ?? "",
    espacioFuente: item.source_space ?? "",
    vencimientoFuente: item.source_expires_text ?? "",
    actualizadoFuente: item.source_updated_at ?? "",
    asignaciones: asignacionesPorPersona.get(item.id) ?? [],
  }));

  if (areaId) {
    resultado = resultado.filter(
      (persona) =>
        persona.areaId === areaId ||
        persona.asignaciones.some((asignacion) => asignacion.areaId === areaId && asignacion.activa),
    );
  }

  return resultado;
}