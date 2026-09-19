import Link from "next/link";
import { CircleAlert, Plus } from "lucide-react";
import { AgendaView } from "@/components/agenda-view";
import { obtenerEntradasAgenda } from "@/lib/agenda-data";

export default async function AgendaPage(){
  const entradas = await obtenerEntradasAgenda();
  return <div className="page-stack"><section className="page-heading"><div><span className="eyebrow">Planificación compartida</span><h1>Agenda cultural</h1><p>Eventos y reuniones de todas las áreas en un único calendario.</p></div><Link className="button primary" href="/registrar?tipo=evento"><Plus size={18}/>Nuevo evento</Link></section><section className="notice"><CircleAlert size={20}/><div><strong>Agenda institucional activa</strong><span>Cada registro nuevo o modificado se actualiza automáticamente en esta vista.</span></div></section><AgendaView entradas={entradas}/></div>
}
