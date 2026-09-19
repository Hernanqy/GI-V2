import { Archive, CalendarDays, FileClock, MapPinned, PartyPopper } from "lucide-react";

export const accesos = [
  { href: "/mapa", titulo: "Mapa cultural", detalle: "Espacios y actividad en el territorio", icono: MapPinned },
  { href: "/agenda", titulo: "Agenda unificada", detalle: "Programación de todas las dependencias", icono: CalendarDays },
  { href: "/eventos", titulo: "Eventos y reuniones", detalle: "Alta y seguimiento de actividades", icono: PartyPopper },
  { href: "/registros", titulo: "Bitácora", detalle: "Historial y memoria institucional", icono: FileClock },
  { href: "/documentos", titulo: "Base documental", detalle: "Fuentes, vigencia y responsables", icono: Archive },
];
