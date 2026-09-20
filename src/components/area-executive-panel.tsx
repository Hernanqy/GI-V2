import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckSquare2,
  ClipboardList,
  FileText,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AreaExecutiveEditor } from "@/components/area-executive-editor";

type EntryRow = {
  id: string;
  kind: string;
  title: string;
  status: string;
  priority: string;
  starts_at: string | null;
  due_date: string | null;
  created_at: string;
};

function fechaCorta(valor: string | null) {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(fecha);
}

function etiquetaTipo(tipo: string) {
  const mapa: Record<string, string> = {
    evento: "Evento",
    solicitud: "Solicitud",
    reunion: "Reunión",
    nota: "Nota",
    actualizacion: "Actualización",
  };
  return mapa[tipo] ?? tipo;
}

export async function AreaExecutivePanel({
  areaId,
  areaName,
  spacesCount,
}: {
  areaId: string;
  areaName: string;
  spacesCount: number;
}) {
  const supabase = await createClient();
  const db = supabase as any;

  const [
    { data: area },
    { data: entries },
    { data: assignments },
    { data: identidad },
  ] = await Promise.all([
    db.from("areas")
      .select("written_agenda, management_summary, management_needs")
      .eq("id", areaId)
      .maybeSingle(),
    db.from("entries")
      .select("id, kind, title, status, priority, starts_at, due_date, created_at")
      .eq("area_id", areaId)
      .order("created_at", { ascending: false })
      .limit(60),
    db.from("staff_assignments")
      .select("staff_id, active")
      .eq("area_id", areaId)
      .eq("active", true),
    supabase.auth.getClaims(),
  ]);

  const filas: EntryRow[] = entries ?? [];
  const ahora = Date.now();

  const pendientes = filas.filter(
    (item) => item.status === "pendiente" || item.status === "borrador",
  );

  const proximos = filas
    .filter((item) => {
      if (!item.starts_at) return false;
      const tiempo = new Date(item.starts_at).getTime();
      return Number.isFinite(tiempo) && tiempo >= ahora;
    })
    .sort((a, b) =>
      new Date(a.starts_at ?? 0).getTime() - new Date(b.starts_at ?? 0).getTime()
    )
    .slice(0, 5);

  const personas = new Set((assignments ?? []).map((item: any) => item.staff_id)).size;
  const claims = identidad?.claims as any;
  const editable =
    claims?.app_metadata?.role === "coordinacion" ||
    claims?.app_metadata?.area_id === areaId;

  return (
    <section className="panel area-executive-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Vista ejecutiva</span>
          <h2>{areaName}</h2>
          <p className="area-executive-intro">
            Resumen operativo de equipo, espacios, pendientes, agenda y situación de gestión.
          </p>
        </div>
        <ClipboardList size={24} />
      </div>

      <div className="area-executive-stats">
        <Link href={`/personal?area=${areaId}`} className="executive-stat-card">
          <Users size={20} />
          <span><strong>{personas}</strong><small>Personal</small></span>
          <ArrowRight size={16} />
        </Link>

        <div className="executive-stat-card">
          <FileText size={20} />
          <span><strong>{spacesCount}</strong><small>Espacios</small></span>
        </div>

        <Link href="/solicitudes" className="executive-stat-card">
          <CheckSquare2 size={20} />
          <span><strong>{pendientes.length}</strong><small>Pendientes</small></span>
          <ArrowRight size={16} />
        </Link>

        <Link href="/agenda" className="executive-stat-card">
          <CalendarDays size={20} />
          <span><strong>{proximos.length}</strong><small>Próximos</small></span>
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="area-executive-grid">
        <div className="executive-block">
          <div className="executive-block-title">
            <CalendarDays size={18} />
            <div><strong>Próxima agenda</strong><span>Eventos y reuniones registradas</span></div>
          </div>
          {proximos.length === 0 ? (
            <div className="executive-empty">No hay próximos eventos o reuniones cargados.</div>
          ) : (
            <div className="executive-list">
              {proximos.map((item) => (
                <div key={item.id}>
                  <span className="executive-date">{fechaCorta(item.starts_at)}</span>
                  <span><strong>{item.title}</strong><small>{etiquetaTipo(item.kind)}</small></span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="executive-block">
          <div className="executive-block-title">
            <AlertTriangle size={18} />
            <div><strong>Pendientes recientes</strong><span>Solicitudes, notas y acciones abiertas</span></div>
          </div>
          {pendientes.length === 0 ? (
            <div className="executive-empty">No hay pendientes registrados.</div>
          ) : (
            <div className="executive-list">
              {pendientes.slice(0, 5).map((item) => (
                <div key={item.id}>
                  <span className={`executive-priority priority-${item.priority}`}>
                    {item.priority === "compromiso_prioritario" ? "Prioridad" :
                     item.priority === "alta" ? "Alta" : "Normal"}
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{etiquetaTipo(item.kind)}{item.due_date ? ` · ${fechaCorta(item.due_date)}` : ""}</small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="executive-management-block">
        <div className="executive-block-title">
          <FileText size={18} />
          <div><strong>Información de gestión</strong><span>Agenda escrita, situación actual y necesidades.</span></div>
        </div>

        {editable ? (
          <AreaExecutiveEditor
            areaId={areaId}
            agenda={area?.written_agenda ?? ""}
            resumen={area?.management_summary ?? ""}
            necesidades={area?.management_needs ?? ""}
          />
        ) : (
          <div className="executive-readonly-notes">
            <div><strong>Agenda escrita</strong><p>{area?.written_agenda || "Sin información cargada."}</p></div>
            <div><strong>Situación actual</strong><p>{area?.management_summary || "Sin información cargada."}</p></div>
            <div><strong>Necesidades / requerimientos</strong><p>{area?.management_needs || "Sin información cargada."}</p></div>
          </div>
        )}
      </div>
    </section>
  );
}