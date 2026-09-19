"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheck, CalendarX2 } from "lucide-react";
import type { EntradaAgenda } from "@/lib/agenda-data";

const etiquetasEstado = {
  borrador: "Borrador",
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
};

function claveMes(fecha: string) {
  const date = new Date(fecha);
  const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/Argentina/Buenos_Aires" }).format(date);
  const month = new Intl.DateTimeFormat("en", { month: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).format(date);
  return `${year}-${month}`;
}

function etiquetaMes(clave: string) {
  const [year, month] = clave.split("-").map(Number);
  const nombre = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

function mostrarFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(fecha));
}

export function AgendaView({ entradas }: { entradas: EntradaAgenda[] }) {
  const meses = Array.from(new Set(entradas.map((entrada) => claveMes(entrada.inicio))));
  const [mesActivo, setMesActivo] = useState(meses[0] ?? "");
  const items = entradas.filter((entrada) => claveMes(entrada.inicio) === mesActivo);

  return <section className="panel">
    {meses.length > 0 ? <div className="month-tabs" role="tablist" aria-label="Mes de agenda">{meses.map((mes) => <button key={mes} type="button" role="tab" aria-selected={mesActivo === mes} className={mesActivo === mes ? "active" : ""} onClick={() => setMesActivo(mes)}>{etiquetaMes(mes)}</button>)}</div> : null}
    {items.length > 0 ? <div className="agenda-table"><div className="agenda-table-head"><span>Fecha y hora</span><span>Actividad</span><span>Área</span><span>Estado</span></div>{items.map((item) => <div className="agenda-table-row" key={item.id}><time>{mostrarFecha(item.inicio)}</time><strong><CalendarCheck size={18}/><Link href={`/eventos/${item.id}/editar`}>{item.titulo}</Link></strong><span>{item.area}{item.espacio ? ` · ${item.espacio}` : ""}</span><em>{etiquetasEstado[item.estado]}</em></div>)}</div> : <div className="inline-empty"><CalendarX2 size={30}/><strong>Sin eventos cargados</strong><span>Los eventos y reuniones registrados aparecerán aquí automáticamente.</span></div>}
  </section>;
}
