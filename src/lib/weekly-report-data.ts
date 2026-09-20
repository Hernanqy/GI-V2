import { createClient } from "@/lib/supabase/server";
import { obtenerPerfilActual } from "@/lib/session-data";

export type WeeklyEntry = {
  id: string;
  titulo: string;
  detalle: string;
  tipo: string;
  estado: string;
  prioridad: string;
  fecha: string | null;
};

export type WeeklyArea = {
  id: string;
  nombre: string;
  descripcion: string;
  situacion: string;
  agendaEscrita: string;
  requerimientos: string;
  personal: number;
  espacios: number;
  agenda: WeeklyEntry[];
  pendientes: WeeklyEntry[];
  avances: WeeklyEntry[];
  problemas: WeeklyEntry[];
};

export type WeeklyReport = {
  inicio: string;
  fin: string;
  inicioAnterior: string;
  inicioSiguiente: string;
  areas: WeeklyArea[];
  totales: {
    dependencias: number;
    personal: number;
    agenda: number;
    pendientes: number;
    avances: number;
    problemas: number;
  };
};

function fechaArgentinaHoy() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function sumarDias(valor: string, dias: number) {
  const fecha = new Date(`${valor}T12:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

function lunesDe(valor: string) {
  const fecha = new Date(`${valor}T12:00:00Z`);
  const dia = fecha.getUTCDay();
  const resta = dia === 0 ? 6 : dia - 1;
  fecha.setUTCDate(fecha.getUTCDate() - resta);
  return fecha.toISOString().slice(0, 10);
}

function normalizarSemana(valor?: string) {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return lunesDe(fechaArgentinaHoy());
  }
  return lunesDe(valor);
}

function dentroDeSemana(valor: string | null, inicio: string, fin: string) {
  if (!valor) return false;
  const dia = valor.slice(0, 10);
  return dia >= inicio && dia <= fin;
}

function mapEntry(item: any): WeeklyEntry {
  return {
    id: item.id,
    titulo: item.title,
    detalle: item.details ?? "",
    tipo: item.kind,
    estado: item.status,
    prioridad: item.priority,
    fecha: item.starts_at ?? item.due_date ?? item.updated_at ?? item.created_at ?? null,
  };
}

export async function obtenerParteSemanal(semana?: string): Promise<WeeklyReport> {
  const inicio = normalizarSemana(semana);
  const fin = sumarDias(inicio, 6);
  const inicioAnterior = sumarDias(inicio, -7);
  const inicioSiguiente = sumarDias(inicio, 7);

  const supabase = await createClient();
  const db = supabase as any;
  const perfil = await obtenerPerfilActual();

  let areasQuery = db
    .from("areas")
    .select("id, name, description, written_agenda, management_summary, management_needs")
    .eq("active", true)
    .order("name");

  if (perfil?.rol === "responsable_area" && perfil.areaId) {
    areasQuery = areasQuery.eq("id", perfil.areaId);
  }

  const { data: areasData, error: areasError } = await areasQuery;
  if (areasError) {
    throw new Error(`No se pudieron cargar las dependencias: ${areasError.message}`);
  }

  const areaIds = (areasData ?? []).map((area: any) => area.id);

  if (areaIds.length === 0) {
    return {
      inicio,
      fin,
      inicioAnterior,
      inicioSiguiente,
      areas: [],
      totales: {
        dependencias: 0,
        personal: 0,
        agenda: 0,
        pendientes: 0,
        avances: 0,
        problemas: 0,
      },
    };
  }

  const [
    { data: entriesData },
    { data: spacesData },
    { data: assignmentsData },
  ] = await Promise.all([
    db
      .from("entries")
      .select("id, area_id, kind, title, details, status, priority, starts_at, due_date, created_at, updated_at")
      .in("area_id", areaIds)
      .order("created_at", { ascending: false })
      .limit(1500),
    db
      .from("spaces")
      .select("id, area_id")
      .in("area_id", areaIds)
      .eq("active", true),
    db
      .from("staff_assignments")
      .select("staff_id, area_id, active")
      .in("area_id", areaIds)
      .eq("active", true),
  ]);

  const entries = entriesData ?? [];
  const spaces = spacesData ?? [];
  const assignments = assignmentsData ?? [];

  const areas: WeeklyArea[] = (areasData ?? []).map((area: any) => {
    const filas = entries.filter((item: any) => item.area_id === area.id);

    const agenda = filas
      .filter(
        (item: any) =>
          (item.kind === "evento" || item.kind === "reunion") &&
          dentroDeSemana(item.starts_at, inicio, fin),
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.starts_at ?? 0).getTime() - new Date(b.starts_at ?? 0).getTime(),
      )
      .map(mapEntry);

    const pendientes = filas
      .filter(
        (item: any) =>
          item.status === "pendiente" ||
          item.status === "borrador",
      )
      .map(mapEntry);

    const avances = filas
      .filter(
        (item: any) =>
          item.status === "completado" &&
          dentroDeSemana(item.updated_at, inicio, fin),
      )
      .map(mapEntry);

    const problemas = filas
      .filter(
        (item: any) =>
          (item.status === "pendiente" || item.status === "borrador") &&
          (item.priority === "alta" || item.priority === "compromiso_prioritario"),
      )
      .map(mapEntry);

    const personal = new Set(
      assignments
        .filter((item: any) => item.area_id === area.id)
        .map((item: any) => item.staff_id),
    ).size;

    return {
      id: area.id,
      nombre: area.name,
      descripcion: area.description ?? "",
      situacion: area.management_summary ?? "",
      agendaEscrita: area.written_agenda ?? "",
      requerimientos: area.management_needs ?? "",
      personal,
      espacios: spaces.filter((item: any) => item.area_id === area.id).length,
      agenda,
      pendientes,
      avances,
      problemas,
    };
  });

  return {
    inicio,
    fin,
    inicioAnterior,
    inicioSiguiente,
    areas,
    totales: {
      dependencias: areas.length,
      personal: areas.reduce((total, area) => total + area.personal, 0),
      agenda: areas.reduce((total, area) => total + area.agenda.length, 0),
      pendientes: areas.reduce((total, area) => total + area.pendientes.length, 0),
      avances: areas.reduce((total, area) => total + area.avances.length, 0),
      problemas: areas.reduce((total, area) => total + area.problemas.length, 0),
    },
  };
}