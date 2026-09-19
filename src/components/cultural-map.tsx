"use client";

import { useDeferredValue, useState } from "react";
import { Building2, Filter, Layers3, MapPin, Search } from "lucide-react";

type AreaMapa = {
  slug: string;
  nombre: string;
  espacios: Array<{ nombre: string; localidad: string; direccion: string; ubicacionValidada: boolean }>;
};

export function CulturalMap({ areas }: { areas: AreaMapa[] }) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("es"));
  const espacios = areas.flatMap(item => item.espacios.map(espacio => ({ ...espacio, area: item.nombre, slug: item.slug })));
  const resultados = espacios.filter(item => (!area || item.slug === area) && (!deferredQuery || `${item.nombre} ${item.area} ${item.localidad} ${item.direccion}`.toLocaleLowerCase("es").includes(deferredQuery)));

  return <div className="map-layout">
    <aside className="filter-panel"><div className="filter-title"><Filter size={19}/><strong>Filtros</strong></div><label><span>Buscar</span><div className="input-wrap"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Espacio o localidad"/></div></label><label><span>Dependencia</span><select value={area} onChange={event => setArea(event.target.value)}><option value="">Todas las dependencias</option>{areas.map(item => <option key={item.slug} value={item.slug}>{item.nombre}</option>)}</select></label><button type="button" className="button" onClick={() => { setQuery(""); setArea(""); }}>Limpiar filtros</button><div className="result-count"><strong>{resultados.length}</strong><span>espacios identificados</span></div></aside>
    <div className="map-workspace">
      <section className="map-canvas"><div className="map-toolbar"><span><Layers3 size={18}/>Mapa institucional</span><em>Coordenadas pendientes de validación</em></div><div className="map-empty"><span><MapPin size={34}/></span><h2>Base territorial preparada</h2><p>Los puntos se ubicarán al validar domicilio, localidad y coordenadas de cada espacio.</p></div><div className="map-grid-lines"/></section>
      <section className="panel map-results"><div className="section-heading compact"><div><span className="eyebrow">Información disponible</span><h2>Espacios incluidos</h2></div><span>{resultados.length} resultados</span></div><div className="space-results">{resultados.map(item => <div key={`${item.slug}-${item.nombre}`}><span><Building2 size={17}/></span><div><strong>{item.nombre}</strong><small>{item.area}{item.localidad ? ` · ${item.localidad}` : ""}</small></div><em>{item.direccion ? "Domicilio cargado" : "Ubicación pendiente"}</em></div>)}</div></section>
    </div>
  </div>;
}
