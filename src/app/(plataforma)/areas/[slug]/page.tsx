import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, FolderKanban, Users } from "lucide-react";
import { AreaEditPanel } from "@/components/area-edit-panel";
import { AreaStaffPanel } from "@/components/area-staff-panel";
import { AreaExecutivePanel } from "@/components/area-executive-panel";
import { AreaOperationalOverview } from "@/components/area-operational-overview";
import { DirectVenuePanel } from "@/components/direct-venue-panel";
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

  // Piloto visual.
  // Por ahora se aplica solamente a Casa del Bicentenario.
  const esPilotoFicha = true;

  // En estas dependencias, dependencia y espacio físico
  // representan prácticamente la misma unidad.
  // Por eso evitamos duplicar la edición institucional.
  const esDependenciaEspacioUnico = [
    "casa-del-bicentenario",
    "centro-cultural-hinojo",
    "centro-cultural-san-jose",
    "centro-cultural-sierras-bayas",
    "teatro-municipal",
  ].includes(area.slug);

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

      <div
        className={`detail-grid ${
          esPilotoFicha
            ? "pilot-wide-detail"
            : ""
        }`}
      >
        <div className="area-detail-main">

          <AreaOperationalOverview
            areaId={area.id}
            areaSlug={area.slug}
            areaName={area.nombre}
            espacios={area.espacios}
          />

          <div
            className="
              area-editor-zone-heading
            "
          >

            <div>

              <span
                className="eyebrow"
              >

                {
                  editable
                    ? "Edición de ficha"
                    : "Ficha institucional"
                }

              </span>


              <h2>

                {
                  editable

                    ? "Actualizar datos institucionales"

                    : "Información institucional"
                }

              </h2>


              <p>

                {
                  editable

                    ? "Los datos operativos se muestran arriba. Modificá aquí la información base del espacio."

                    : "Información base registrada para este espacio."
                }

              </p>

            </div>

          </div>
          {["casa-del-bicentenario", "centro-cultural-hinojo", "centro-cultural-san-jose", "centro-cultural-sierras-bayas", "teatro-municipal"].includes(area.slug) ? (
            <DirectVenuePanel
              areaId={area.id}
              slug={area.slug}
              areaName={area.nombre}
              espacio={area.espacios[0]}
              editable={editable}
            />
          ) : (
            <SpaceManager espacios={area.espacios} areaId={area.id} slug={area.slug} editable={editable} />
          )}
          <AreaExecutivePanel areaId={area.id} areaName={area.nombre} spacesCount={area.espacios.length} />
          <AreaStaffPanel areaId={area.id} slug={area.slug} espacios={area.espacios} />
        </div>
        <aside className="detail-aside">
          {editable && !esDependenciaEspacioUnico ? (
            <AreaEditPanel
              id={area.id}
              slug={area.slug}
              nombre={area.nombre}
              descripcion={area.descripcion}
            />
          ) : null}
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
