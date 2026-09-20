import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, FolderKanban, Users } from "lucide-react";
import { AreaEditPanel } from "@/components/area-edit-panel";
import { AreaStaffPanel } from "@/components/area-staff-panel";
import { AreaExecutivePanel } from "@/components/area-executive-panel";
import { SpaceManager } from "@/components/space-manager";
import { obtenerAreas } from "@/lib/areas-data";
import { obtenerPerfilActual } from "@/lib/session-data";

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [areas, perfil] = await Promise.all([obtenerAreas(), obtenerPerfilActual()]);
  const area = areas.find((item) => item.slug === slug);

  if (!area) notFound();

  const Icon = area.icono;
  const editable = perfil?.rol === "coordinacion";

  return (
    <div className="page-stack">
      <Link href="/areas" className="back-link"><ArrowLeft size={17} />Volver a dependencias</Link>
      <section className="detail-hero">
        <span className={`area-icon accent-${area.color}`}><Icon size={30} /></span>
        <div>
          <span className="eyebrow">Dependencia cultural</span>
          <h1>{area.nombre}</h1>
          <p>{area.descripcion}</p>
        </div>
        <span className="status structure-status">{area.espacios.length} {area.espacios.length === 1 ? "espacio" : "espacios"}</span>
      </section>

      <div className="detail-grid">
        <div className="area-detail-main">
          <SpaceManager espacios={area.espacios} areaId={area.id} slug={area.slug} editable={editable} />
          <AreaExecutivePanel areaId={area.id} areaName={area.nombre} spacesCount={area.espacios.length} />
          <AreaStaffPanel areaId={area.id} slug={area.slug} espacios={area.espacios} />
        </div>
        <aside className="detail-aside">
          {editable ? <AreaEditPanel id={area.id} slug={area.slug} nombre={area.nombre} descripcion={area.descripcion} /> : null}
          <div className="panel">
            <h2>Información conectada</h2>
            <div className="quick-list">
              <div><span><Users size={20} /></span><strong>Equipo y responsables</strong></div>
              <div><span><CalendarDays size={20} /></span><strong>Agenda</strong></div>
              <div><span><FolderKanban size={20} /></span><strong>Proyectos y necesidades</strong></div>
              <div><span><FileText size={20} /></span><strong>Documentos</strong></div>
            </div>
          </div>
          <div className="data-note">
            <FileText size={20} />
            <span>Los cambios de nombre se reflejan automáticamente en Registrar, Agenda, Solicitudes y Bitácora.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
