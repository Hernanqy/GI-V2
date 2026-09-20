import { ShieldCheck, Users } from "lucide-react";
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

  const areasPermitidas = perfil?.rol === "coordinacion"
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

  const personasPermitidas = personas.filter((persona) =>
    opciones.some((area) => area.id === persona.areaId),
  );

  const initialAreaId = opciones.some((area) => area.id === areaSolicitada)
    ? areaSolicitada
    : "";

  const editable = Boolean(perfil);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Organización institucional</span>
          <h1>Personal</h1>
          <p>Personas vinculadas a cada dependencia y espacio, con legajo, rol, tareas y estado operativo.</p>
        </div>
        <span className="heading-icon"><Users size={26} /></span>
      </section>

      {perfil?.rol !== "coordinacion" ? (
        <section className="notice neutral-notice">
          <ShieldCheck size={20} />
          <div>
            <strong>Vista de tu dependencia</strong>
            <span>El acceso queda limitado al personal de la dependencia asociada a tu usuario.</span>
          </div>
        </section>
      ) : null}

      <StaffManager
        personas={personasPermitidas}
        areas={opciones}
        editable={editable}
        initialAreaId={initialAreaId}
      />
    </div>
  );
}