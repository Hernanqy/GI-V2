import Link from "next/link";
import { ArrowRight, CircleAlert, Compass, Database, Plus } from "lucide-react";
import { accesos } from "@/lib/cultura-data";
import { obtenerAreas } from "@/lib/areas-data";
import { obtenerProximasEntradas } from "@/lib/agenda-data";

function mostrarFecha(valor: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(valor));
}

const estados = { borrador: "Borrador", pendiente: "Pendiente", confirmado: "Confirmado", completado: "Realizado", cancelado: "Cancelado" };

export default async function InicioPage() {
  const [proximas, areas] = await Promise.all([obtenerProximasEntradas(4), obtenerAreas()]);
  return <div className="page-stack">
    <section className="page-heading"><div><span className="eyebrow">Plataforma institucional</span><h1>Toda Cultura en un lugar</h1><p>Información organizada para consultar, coordinar y tomar decisiones.</p></div><Link className="button primary" href="/registrar"><Plus size={18}/>Registrar</Link></section>
    <section className="notice"><CircleAlert size={20}/><div><strong>Preparación para octubre de 2026</strong><span>La información documental está cargada como antecedente y debe ser validada por cada dependencia.</span></div></section>
    <section><div className="section-heading"><div><span className="eyebrow">Estructura institucional</span><h2>Dependencias culturales</h2></div><Link href="/areas">Ver todas <ArrowRight size={16}/></Link></div><div className="area-grid">{areas.map(({slug,nombre,descripcion,icono:Icon,color})=><Link href={`/areas/${slug}`} className={`area-card accent-${color}`} key={slug}><span className="area-icon"><Icon size={26}/></span><ArrowRight className="area-arrow" size={18}/><h3>{nombre}</h3><p>{descripcion}</p></Link>)}</div></section>
    <div className="content-grid">
      <section className="panel"><div className="section-heading compact"><div><span className="eyebrow">Agenda compartida</span><h2>Próximos eventos</h2></div><Link href="/agenda">Abrir agenda</Link></div>{proximas.length === 0 ? <div className="home-empty"><strong>Sin eventos próximos</strong><span>Cuando registres una actividad aparecerá aquí.</span></div> : <div className="agenda-list">{proximas.map(item=><Link className="agenda-row" href={`/eventos/${item.id}/editar`} key={item.id}><time>{mostrarFecha(item.inicio)}</time><div><strong>{item.titulo}</strong><span>{item.area}</span></div><em>{estados[item.estado]}</em></Link>)}</div>}</section>
      <section className="panel"><div className="section-heading compact"><div><span className="eyebrow">Accesos principales</span><h2>Explorar la plataforma</h2></div></div><div className="quick-list">{accesos.map(({href,titulo,detalle,icono:Icon})=><Link href={href} key={href}><span><Icon size={21}/></span><div><strong>{titulo}</strong><small>{detalle}</small></div><ArrowRight size={17}/></Link>)}</div><div className="data-note"><Database size={20}/><span>La aplicación distingue información vigente, pendiente de revisión e histórica.</span></div></section>
    </div>
    <Link href="/mapa" className="territory-banner"><span><Compass size={24}/></span><div><strong>Mapa cultural del Partido de Olavarría</strong><p>Espacios, monumentos, escuelas, propuestas y actividad cultural con filtros territoriales.</p></div><ArrowRight size={20}/></Link>
  </div>;
}
