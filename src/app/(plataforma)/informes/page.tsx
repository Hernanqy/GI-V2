import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileBarChart,
  Users,
} from "lucide-react";
import { obtenerParteSemanal, type WeeklyEntry } from "@/lib/weekly-report-data";
import { WeeklyReportPrint } from "@/components/weekly-report-print";

function mostrarDia(valor: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${valor}T12:00:00Z`));
}

function mostrarFechaEntrada(valor: string | null) {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(fecha);
}

function tipoLabel(tipo: string) {
  const mapa: Record<string, string> = {
    evento: "Evento",
    solicitud: "Solicitud",
    reunion: "Reunión",
    nota: "Nota",
    actualizacion: "Actualización",
  };
  return mapa[tipo] ?? tipo;
}

function Lista({
  items,
  vacio,
}: {
  items: WeeklyEntry[];
  vacio: string;
}) {
  if (items.length === 0) {
    return <div className="weekly-empty">{vacio}</div>;
  }

  return (
    <div className="weekly-item-list">
      {items.map((item) => (
        <div className="weekly-item" key={item.id}>
          <span>
            <strong>{item.titulo}</strong>
            <small>
              {tipoLabel(item.tipo)}
              {item.fecha ? ` · ${mostrarFechaEntrada(item.fecha)}` : ""}
            </small>
          </span>
          {item.detalle ? <p>{item.detalle}</p> : null}
        </div>
      ))}
    </div>
  );
}

export default async function InformesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const reporte = await obtenerParteSemanal(week);

  return (
    <div className="page-stack weekly-report-page">
      <section className="page-heading weekly-report-heading">
        <div>
          <span className="eyebrow">Lectura para la gestión</span>
          <h1>Parte semanal</h1>
          <p>
            Semana del {mostrarDia(reporte.inicio)} al {mostrarDia(reporte.fin)}.
            Resumen consolidado por dependencia.
          </p>
        </div>
        <div className="weekly-heading-actions">
          <WeeklyReportPrint />
          <span className="heading-icon"><FileBarChart size={26} /></span>
        </div>
      </section>

      <section className="weekly-nav panel">
        <Link className="button" href={`/informes?week=${reporte.inicioAnterior}`}>
          <ArrowLeft size={16} />
          Semana anterior
        </Link>
        <div>
          <strong>{mostrarDia(reporte.inicio)} — {mostrarDia(reporte.fin)}</strong>
          <span>Parte institucional de Cultura</span>
        </div>
        <Link className="button" href={`/informes?week=${reporte.inicioSiguiente}`}>
          Semana siguiente
          <ArrowRight size={16} />
        </Link>
      </section>

      <section className="weekly-summary-grid">
        <div className="weekly-summary-card">
          <ClipboardList size={20} />
          <span><strong>{reporte.totales.dependencias}</strong><small>Dependencias</small></span>
        </div>
        <div className="weekly-summary-card">
          <Users size={20} />
          <span><strong>{reporte.totales.personal}</strong><small>Asignaciones activas</small></span>
        </div>
        <div className="weekly-summary-card">
          <CalendarDays size={20} />
          <span><strong>{reporte.totales.agenda}</strong><small>Agenda semanal</small></span>
        </div>
        <div className="weekly-summary-card">
          <AlertTriangle size={20} />
          <span><strong>{reporte.totales.pendientes}</strong><small>Pendientes abiertos</small></span>
        </div>
        <div className="weekly-summary-card">
          <CheckCircle2 size={20} />
          <span><strong>{reporte.totales.avances}</strong><small>Avances cerrados</small></span>
        </div>
      </section>

      <div className="weekly-areas">
        {reporte.areas.map((area) => (
          <section className="panel weekly-area-card" key={area.id}>
            <div className="weekly-area-header">
              <div>
                <span className="eyebrow">Dependencia</span>
                <h2>{area.nombre}</h2>
                {area.situacion ? <p>{area.situacion}</p> : null}
              </div>
              <div className="weekly-area-meta">
                <span><strong>{area.personal}</strong> personal</span>
                <span><strong>{area.espacios}</strong> espacios</span>
              </div>
            </div>

            <div className="weekly-sections-grid">
              <article className="weekly-section">
                <div className="weekly-section-title">
                  <CalendarDays size={17} />
                  <strong>Agenda</strong>
                </div>
                {area.agendaEscrita ? (
                  <div className="weekly-free-text">
                    <span>Agenda escrita</span>
                    <p>{area.agendaEscrita}</p>
                  </div>
                ) : null}
                <Lista items={area.agenda} vacio="Sin agenda registrada para esta semana." />
              </article>

              <article className="weekly-section">
                <div className="weekly-section-title">
                  <ClipboardList size={17} />
                  <strong>Pendientes</strong>
                </div>
                <Lista items={area.pendientes} vacio="Sin pendientes abiertos." />
              </article>

              <article className="weekly-section">
                <div className="weekly-section-title">
                  <CheckCircle2 size={17} />
                  <strong>Avances</strong>
                </div>
                <Lista items={area.avances} vacio="Sin cierres registrados esta semana." />
              </article>

              <article className="weekly-section">
                <div className="weekly-section-title">
                  <AlertTriangle size={17} />
                  <strong>Problemas / alertas</strong>
                </div>
                <Lista items={area.problemas} vacio="Sin alertas prioritarias abiertas." />
              </article>

              <article className="weekly-section weekly-requirements">
                <div className="weekly-section-title">
                  <FileBarChart size={17} />
                  <strong>Requerimientos</strong>
                </div>
                {area.requerimientos ? (
                  <div className="weekly-free-text plain">
                    <p>{area.requerimientos}</p>
                  </div>
                ) : (
                  <div className="weekly-empty">Sin requerimientos cargados.</div>
                )}
              </article>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}