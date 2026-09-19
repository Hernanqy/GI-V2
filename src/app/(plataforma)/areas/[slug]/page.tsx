import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, FolderKanban, Users } from "lucide-react";
import { obtenerAreas } from "@/lib/areas-data";

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const areas = await obtenerAreas();
  const area = areas.find((item) => item.slug === slug);

  if (!area) notFound();

  const Icon = area.icono;

  return (
    <div className="page-stack">
      <Link href="/areas" className="back-link"><ArrowLeft size={17} />Volver a áreas</Link>
      <section className="detail-hero">
        <span className={`area-icon accent-${area.color}`}><Icon size={30} /></span>
        <div>
          <span className="eyebrow">Área cultural</span>
          <h1>{area.nombre}</h1>
          <p>{area.descripcion}</p>
        </div>
        <span className="status pending">Información por validar</span>
      </section>
      <div className="detail-grid">
        <section className="panel">
          <h2>Espacios y líneas de trabajo</h2>
          {area.espacios.length > 0 ? (
            <div className="space-list">
              {area.espacios.map((espacio) => (
                <div key={espacio.id}>
                  <span>{espacio.nombre.slice(0, 1)}</span>
                  <strong>{espacio.nombre}</strong>
                  <em>Pendiente de ficha</em>
                </div>
              ))}
            </div>
          ) : (
            <div className="inline-empty">
              <strong>Sin espacios cargados</strong>
              <span>Esta área todavía no tiene espacios registrados en la base.</span>
            </div>
          )}
        </section>
        <aside className="detail-aside">
          <div className="panel">
            <h2>Secciones del área</h2>
            <div className="quick-list">
              <div><span><Users size={20} /></span><strong>Equipo y responsables</strong></div>
              <div><span><CalendarDays size={20} /></span><strong>Agenda</strong></div>
              <div><span><FolderKanban size={20} /></span><strong>Proyectos y necesidades</strong></div>
              <div><span><FileText size={20} /></span><strong>Documentos</strong></div>
            </div>
          </div>
          <div className="data-note">
            <FileText size={20} />
            <span>Las fichas se completarán con información validada por el responsable del área.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
