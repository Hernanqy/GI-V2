import { CulturalMap } from "@/components/cultural-map";
import { obtenerAreas } from "@/lib/areas-data";

export default async function MapaPage(){
  const areas = await obtenerAreas();
  const data = areas.map((area) => ({
    slug: area.slug,
    nombre: area.nombre,
    espacios: area.espacios.map((espacio) => ({
      nombre: espacio.nombre,
      localidad: espacio.localidad,
      direccion: espacio.direccion,
      ubicacionValidada: espacio.ubicacionValidada,
    })),
  }));
  return <div className="page-stack map-page"><section className="page-heading"><div><span className="eyebrow">Territorio cultural</span><h1>Mapa cultural</h1><p>Consulta geográfica de espacios, patrimonio, escuelas y actividad cultural.</p></div></section><CulturalMap areas={data} /></div>;
}
