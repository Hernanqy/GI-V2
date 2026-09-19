import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { obtenerAreas } from "@/lib/areas-data";

export default async function AreasPage() {
  const areas = await obtenerAreas();

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Organización cultural</span>
          <h1>Áreas y espacios</h1>
          <p>Cada área reúne sus equipos, espacios, agenda, proyectos, necesidades y documentos.</p>
        </div>
      </section>
      <div className="area-grid large">
        {areas.map(({ slug, nombre, descripcion, icono: Icon, color, espacios }) => (
          <Link href={`/areas/${slug}`} className={`area-card accent-${color}`} key={slug}>
            <span className="area-icon"><Icon size={28} /></span>
            <ArrowRight className="area-arrow" size={18} />
            <h2>{nombre}</h2>
            <p>{descripcion}</p>
            <small>{espacios.length} espacios identificados</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
