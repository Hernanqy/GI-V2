import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, UserRound, Users } from "lucide-react";
import { obtenerPersonal } from "@/lib/staff-data";

export async function AreaStaffPanel({
  areaId,
  slug,
  espacios,
}: {
  areaId: string;
  slug: string;
  espacios: Array<{ id: string; nombre: string }>;
}) {
  const personas = await obtenerPersonal(areaId);
  const centrales = personas.filter((persona) => !persona.spaceId && persona.estado !== "baja");

  const grupos = [
    {
      id: "central",
      nombre: "Equipo central de la dependencia",
      personas: centrales,
    },
    ...espacios.map((espacio) => ({
      id: espacio.id,
      nombre: espacio.nombre,
      personas: personas.filter(
        (persona) => persona.spaceId === espacio.id && persona.estado !== "baja",
      ),
    })),
  ];

  return (
    <section className="panel area-staff-panel">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Equipo y responsables</span>
          <h2>Personal por espacio</h2>
        </div>
        <span className="space-count">
          {personas.filter((persona) => persona.estado !== "baja").length} personas
        </span>
      </div>

      <div className="area-staff-groups">
        {grupos.map((grupo) => (
          <details className="staff-space-group" key={grupo.id}>
            <summary>
              <span className="space-editor-icon">
                {grupo.id === "central" ? <Users size={17} /> : <BriefcaseBusiness size={17} />}
              </span>
              <span>
                <strong>{grupo.nombre}</strong>
                <small>
                  {grupo.personas.length === 0
                    ? "Sin personal vinculado"
                    : `${grupo.personas.length} ${grupo.personas.length === 1 ? "persona" : "personas"}`}
                </small>
              </span>
              <ArrowRight size={17} />
            </summary>

            <div className="area-staff-people">
              {grupo.personas.length === 0 ? (
                <span className="staff-empty-row">Sin personal cargado en este espacio.</span>
              ) : (
                grupo.personas.map((persona) => (
                  <div key={persona.id}>
                    <span className="staff-mini-avatar"><UserRound size={15} /></span>
                    <span>
                      <strong>{persona.nombre}</strong>
                      <small>{persona.rol || persona.tareas || "Función a completar"}</small>
                    </span>
                    {persona.legajo ? <em>Legajo {persona.legajo}</em> : null}
                  </div>
                ))
              )}
            </div>
          </details>
        ))}
      </div>

      <Link className="button staff-manage-link" href={`/personal?area=${areaId}`}>
        Gestionar personal
        <ArrowRight size={16} />
      </Link>
      <span className="staff-area-slug" hidden>{slug}</span>
    </section>
  );
}