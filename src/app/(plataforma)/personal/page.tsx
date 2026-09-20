import { DatabaseZap, ShieldCheck, Users } from "lucide-react";
import { StaffManager, type AreaPersonalOption } from "@/components/staff-manager";
import { obtenerAreas } from "@/lib/areas-data";
import { obtenerPersonal } from "@/lib/staff-data";
import { obtenerPerfilActual } from "@/lib/session-data";

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const [{ area: areaSolicitada }, areas, perfil, personas] = await Promise.all([
    searchParams,
    obtenerAreas(),
    obtenerPerfilActual(),
    obtenerPersonal(),
  ]);

  const esCoordinacion = perfil?.rol === "coordinacion";

  const areasPermitidas = esCoordinacion
    ? areas
    : areas.filter((area) => area.id === perfil?.areaId);

  const opciones: AreaPersonalOption[] = areasPermitidas.map((area) => ({
    id: area.id,
    nombre: area.nombre,
    slug: area.slug,
    espacios: area.espacios.map((espacio) => ({
      id: espacio.id,
      nombre: espacio.nombre,
    })),
  }));

  const initialAreaId =
    areaSolicitada === "central" && esCoordinacion
      ? "central"
      : opciones.some((area) => area.id === areaSolicitada)
        ? areaSolicitada
        : "";

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Organización institucional</span>
          <h1>Personal</h1>
          <p>
            Padrón unificado con legajo, datos administrativos y todas las asignaciones
            que una misma persona puede tener en Cultura.
          </p>
        </div>
        <span className="heading-icon"><Users size={26} /></span>
      </section>

      <section className="notice stage14-notice">
        <DatabaseZap size={20} />
        <div>
          <strong>Padrón 2026 incorporado</strong>
          <span>
            La estructura admite varias asignaciones por persona sin duplicar su ficha institucional.
          </span>
        </div>
      </section>

      {!esCoordinacion ? (
        <section className="notice neutral-notice">
          <ShieldCheck size={20} />
          <div>
            <strong>Vista de tu dependencia</strong>
            <span>
              Se muestran las personas que tienen una asignación vinculada a tu dependencia.
            </span>
          </div>
        </section>
      ) : null}

      <StaffManager
        personas={personas}
        areas={opciones}
        editable={Boolean(perfil)}
        canManageCentral={esCoordinacion}
        initialAreaId={initialAreaId}
      />
    </div>
  );
}