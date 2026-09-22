import { Plus } from "lucide-react";

import { RegisterForm } from "@/components/register-form";
import { obtenerAreas } from "@/lib/areas-data";


export default async function RegistrarPage({
  searchParams,
}: {
  searchParams:
    Promise<{
      tipo?: string;
      area?: string;
      space?: string;
    }>;
}) {

  const {
    tipo,
    area,
    space,
  } =
    await searchParams;


  const areas =
    await obtenerAreas();


  const tipoInicial =
    tipo === "evento" ||
    tipo === "reunion" ||
    tipo === "solicitud" ||
    tipo === "nota" ||
    tipo === "actualizacion"
      ? tipo
      : "";


  return (
    <div className="page-stack">

      <section className="page-heading">

        <div>
          <span className="eyebrow">
            Carga institucional
          </span>

          <h1>
            Registrar información
          </h1>

          <p>
            Un único ingreso para actividades, solicitudes, reuniones y actualizaciones.
          </p>
        </div>

        <span className="heading-icon">
          <Plus size={24} />
        </span>

      </section>


      <RegisterForm
        tipoInicial={tipoInicial}
        areaInicial={area ?? ""}
        spaceInicial={space ?? ""}
        areas={
          areas.map(
            ({
              id,
              nombre,
              espacios,
            }) => ({
              id,
              nombre,
              espacios,
            }),
          )
        }
      />

    </div>
  );
}