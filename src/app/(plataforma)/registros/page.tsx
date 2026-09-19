import Link from "next/link";
import { CalendarCheck, FileClock, Filter, Pencil, Plus, Search } from "lucide-react";
import { DeleteRecordButton } from "@/components/delete-record-button";
import { obtenerAreas } from "@/lib/areas-data";
import { obtenerRegistros } from "@/lib/registros-data";

const nombresTipo = { evento: "Evento realizado", reunion: "Reunión realizada", nota: "Nota institucional", actualizacion: "Actualización" };
function valorSimple(valor: string | string[] | undefined) { return Array.isArray(valor) ? valor[0] ?? "" : valor ?? ""; }
function mostrarFecha(valor: string) { return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(valor)); }

export default async function RegistrosPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; tipo?: string | string[]; area?: string | string[] }> }) {
  const filtros = await searchParams;
  const q = valorSimple(filtros.q).trim().toLocaleLowerCase("es");
  const tipo = valorSimple(filtros.tipo);
  const area = valorSimple(filtros.area);
  const [registros, areas] = await Promise.all([obtenerRegistros(), obtenerAreas()]);
  const filtrados = registros.filter((item) => (!tipo || item.tipo === tipo) && (!area || item.areaId === area) && (!q || `${item.titulo} ${item.detalle} ${item.area} ${item.espacio ?? ""}`.toLocaleLowerCase("es").includes(q)));
  return <div className="page-stack">
    <section className="page-heading"><div><span className="eyebrow">Memoria institucional</span><h1>Bitácora y registros</h1><p>Historial centralizado de hechos, reuniones, eventos y actualizaciones.</p></div><Link className="button primary" href="/registrar?tipo=nota"><Plus size={18}/>Nueva nota</Link></section>
    <form className="record-filters panel" method="get"><label className="record-search"><span>Buscar</span><div className="input-wrap"><Search size={17}/><input name="q" defaultValue={valorSimple(filtros.q)} placeholder="Título, detalle, área o espacio"/></div></label><label><span>Tipo</span><select name="tipo" defaultValue={tipo}><option value="">Todos</option><option value="nota">Notas</option><option value="actualizacion">Actualizaciones</option><option value="evento">Eventos realizados</option><option value="reunion">Reuniones realizadas</option></select></label><label><span>Dependencia</span><select name="area" defaultValue={area}><option value="">Todas</option>{areas.map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}</select></label><button className="button" type="submit"><Filter size={17}/>Aplicar filtros</button>{(q || tipo || area) ? <Link className="record-clear" href="/registros">Limpiar filtros</Link> : null}</form>
    <section className="panel record-panel"><div className="section-heading compact"><div><span className="eyebrow">Historial consultable</span><h2>{filtrados.length} {filtrados.length === 1 ? "registro" : "registros"}</h2></div></div>{filtrados.length === 0 ? <div className="inline-empty"><FileClock size={34}/><strong>No hay registros para mostrar</strong><span>Podés cambiar los filtros o crear una nueva nota institucional.</span></div> : <div className="record-list">{filtrados.map((item) => <article className="record-row" key={`${item.tipo}-${item.id}`}><span className="record-icon">{item.tipo === "evento" || item.tipo === "reunion" ? <CalendarCheck size={20}/> : <FileClock size={20}/>}</span><div className="record-body"><div className="record-heading"><div><span className={`record-kind kind-${item.tipo}`}>{nombresTipo[item.tipo]}</span><h3>{item.titulo}</h3></div><time>{mostrarFecha(item.fecha)}</time></div><p>{item.detalle}</p><small>{item.area}{item.espacio ? ` · ${item.espacio}` : ""}</small><div className="request-actions">{item.tipo === "nota" || item.tipo === "actualizacion" ? <><Link className="request-action" href={`/registros/${item.id}/editar`}><Pencil size={16}/><span>Editar</span></Link><DeleteRecordButton id={item.id} titulo={item.titulo}/></> : <Link className="request-action" href={`/eventos/${item.id}/editar`}><Pencil size={16}/><span>Ver evento</span></Link>}</div></div></article>)}</div>}</section>
  </div>;
}
