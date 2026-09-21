import "leaflet/dist/leaflet.css";

import { MapPinned } from "lucide-react";
import { CulturalMap } from "@/components/cultural-map";
import { obtenerAreas } from "@/lib/areas-data";
import { obtenerPerfilActual } from "@/lib/session-data";

export default async function MapaPage() {
  const [areas, perfil] = await Promise.all([
    obtenerAreas(),
    obtenerPerfilActual(),
  ]);

  const areasPermitidas =
    perfil?.rol === "responsable_area" && perfil.areaId
      ? areas.filter((area) => area.id === perfil.areaId)
      : areas;

  const espacios = areasPermitidas.flatMap((area) =>
    area.espacios.map((espacio) => ({
      id: espacio.id,
      areaId: area.id,
      areaSlug: area.slug,
      areaNombre: area.nombre,

      nombre: espacio.nombre,
      tipo: espacio.tipo,
      localidad: espacio.localidad,
      direccion: espacio.direccion,

      latitud: espacio.latitud,
      longitud: espacio.longitud,
      validada: espacio.ubicacionValidada,

      responsable: espacio.responsable,
      estado: espacio.estadoOperativo,
    })),
  );

  const dependencias = areasPermitidas.map((area) => ({
    slug: area.slug,
    nombre: area.nombre,
  }));

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Territorio cultural</span>
          <h1>Mapa cultural</h1>
          <p>
            Ubicación y validación territorial de los espacios culturales
            del Partido de Olavarría.
          </p>
        </div>

        <span className="heading-icon">
          <MapPinned size={26} />
        </span>
      </section>

      <CulturalMap
        dependencias={dependencias}
        espacios={espacios}
        editable={Boolean(perfil)}
      />
    </div>
  );
}