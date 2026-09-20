"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Archive, Bot, Building2, CalendarDays, ClipboardList, FileBarChart, FileClock, Home, LogOut, MapPinned, Menu, PartyPopper, PlusCircle, Search, Users, X } from "lucide-react";
import { cerrarSesion } from "@/app/auth/actions";

const navegacion = [
  { href: "/", etiqueta: "Inicio", icono: Home },
  { href: "/registrar", etiqueta: "Registrar", icono: PlusCircle },
  { href: "/areas", etiqueta: "Dependencias y espacios", icono: Building2 },
  { href: "/personal?area=todas", etiqueta: "Personal", icono: Users },
  { href: "/mapa", etiqueta: "Mapa cultural", icono: MapPinned },
  { href: "/agenda", etiqueta: "Agenda", icono: CalendarDays },
  { href: "/eventos", etiqueta: "Eventos", icono: PartyPopper },
  { href: "/solicitudes", etiqueta: "Solicitudes", icono: ClipboardList },
  { href: "/registros", etiqueta: "Bitácora", icono: FileClock },
  { href: "/documentos", etiqueta: "Documentos", icono: Archive },
  { href: "/informes", etiqueta: "Informes", icono: FileBarChart },
];

type ItemBusqueda = { titulo: string; detalle: string; href: string };

export function AppShell({ children, nombreUsuario, rolUsuario, busquedaItems }: { children: React.ReactNode; nombreUsuario: string; rolUsuario: string; busquedaItems: ItemBusqueda[] }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [consulta, setConsulta] = useState("");
  const resultados = busquedaItems.filter(item => !consulta.trim() || `${item.titulo} ${item.detalle}`.toLocaleLowerCase("es").includes(consulta.trim().toLocaleLowerCase("es"))).slice(0, 8);
  return <div className="app-shell">
    <header className="topbar">
      <button className="menu-button" onClick={() => setAbierto(true)} aria-label="Abrir menú"><Menu size={22}/></button>
      <Link href="/" className="brand" aria-label="Ir al inicio"><span className="brand-mark">GI</span><span><strong>Cultura · Olavarría</strong><small>Gestión institucional</small></span></Link>
      <div className="topbar-actions">
        <button className="icon-button" aria-label="Buscar" onClick={() => setBusquedaAbierta(true)}><Search size={20}/></button>
        <span className="profile-chip"><strong>{nombreUsuario}</strong><small>{rolUsuario}</small></span>
        <form action={cerrarSesion}><button className="icon-button" type="submit" aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={19}/></button></form>
      </div>
    </header>
    {busquedaAbierta ? <div className="search-layer" role="dialog" aria-modal="true" aria-label="Búsqueda global"><button className="search-scrim" aria-label="Cerrar búsqueda" onClick={() => setBusquedaAbierta(false)}/><section className="search-dialog"><div className="search-box"><Search size={20}/><input autoFocus value={consulta} onChange={event => setConsulta(event.target.value)} placeholder="Buscar dependencia o espacio cultural"/><button className="icon-button" aria-label="Cerrar búsqueda" onClick={() => setBusquedaAbierta(false)}><X size={20}/></button></div><div className="search-results">{resultados.map(item => <Link key={`${item.href}-${item.titulo}`} href={item.href} onClick={() => { setBusquedaAbierta(false); setConsulta(""); }}><span>{item.titulo}</span><small>{item.detalle}</small></Link>)}</div></section></div> : null}
    {abierto && <button className="scrim" aria-label="Cerrar menú" onClick={() => setAbierto(false)}/>} 
    <aside className={`sidebar ${abierto ? "is-open" : ""}`}>
      <div className="sidebar-head"><span>Navegación</span><button className="icon-button mobile-only" onClick={() => setAbierto(false)} aria-label="Cerrar menú"><X size={20}/></button></div>
      <nav>{navegacion.map(({href,etiqueta,icono:Icon})=>{const activo=href==="/"?pathname==="/":pathname.startsWith(href);return <Link key={href} href={href} className={activo?"active":""} onClick={()=>setAbierto(false)}><Icon size={19}/><span>{etiqueta}</span></Link>})}</nav>
      <div className="assistant-card"><Bot size={22}/><div><strong>Asistente de Cultura</strong><small>Integración prevista con la API de OpenAI.</small></div><span>Próxima etapa</span></div>
    </aside>
    <main className="main-content">{children}</main>
  </div>;
}
