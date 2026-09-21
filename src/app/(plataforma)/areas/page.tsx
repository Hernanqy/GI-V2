import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { AreaCreateForm } from "@/components/area-create-form";
import { obtenerAreas } from "@/lib/areas-data";
import { obtenerPerfilActual } from "@/lib/session-data";

export default async function AreasPage() {
  const [areas, perfil] = await Promise.all([
    obtenerAreas(),
    obtenerPerfilActual(),
  ]);

  const editable = perfil?.rol === "coordinacion";

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Organización cultural</span>
          <h1>Dependencias y espacios</h1>
          <p>
            Estructura institucional editable y conectada con agenda,
            solicitudes, registros y carga de información.
          </p>
        </div>
      </section>

      {!editable ? (
        <section className="notice neutral-notice">
          <ShieldCheck size={20} />
          <div>
            <strong>Vista de consulta</strong>
            <span>
              La edición de la estructura está reservada a Coordinación.
            </span>
          </div>
        </section>
      ) : null}

      <section>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Estructura vigente</span>
            <h2>Dependencias culturales</h2>
          </div>

          <span className="structure-total">
            {areas.length}{" "}
            {areas.length === 1 ? "dependencia" : "dependencias"}
          </span>
        </div>

        <div className="area-grid large">
          {areas.map(
            ({
              slug,
              nombre,
              descripcion,
              icono: Icon,
              color,
              espacios,
            }) => (
              <Link
                href={`/areas/${slug}`}
                className={`area-card accent-${color}`}
                key={slug}
              >
                <span className="area-icon">
                  <Icon size={28} />
                </span>

                <ArrowRight
                  className="area-arrow"
                  size={18}
                />

                <h2>{nombre}</h2>

                <p>{descripcion}</p>

                <small>
                  {espacios.length}{" "}
                  {espacios.length === 1
                    ? "espacio identificado"
                    : "espacios identificados"}
                </small>
              </Link>
            ),
          )}
        </div>
      </section>

      {editable ? (
        <section className="secondary-admin-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Administración</span>
              <h2>Agregar a la estructura</h2>
            </div>
          </div>

          <AreaCreateForm />
        </section>
      ) : null}
    </div>
  );
}