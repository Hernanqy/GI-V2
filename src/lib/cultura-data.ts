import { Archive, Building2, CalendarDays, FileClock, GraduationCap, Landmark, MapPinned, PartyPopper, Theater, Trees, type LucideIcon } from "lucide-react";

export type AreaCultural = { slug: string; nombre: string; descripcion: string; icono: LucideIcon; color: string; espacios: string[] };

export const areas: AreaCultural[] = [
  { slug: "patrimonio-cultural", nombre: "Patrimonio Cultural", descripcion: "Museos, archivo, IIAO, monumentos y bienes patrimoniales.", icono: Landmark, color: "violet", espacios: ["Museo Dámaso Arce", "Museo Hermanos Emiliozzi", "Archivo Histórico Municipal", "IIAO", "Museo Estación Sierras Bayas", "Museo Hogar Loma Negra", "Museo Alemanes del Volga Ariel Chierico", "Museo Municipal de Espigas", "Museo Municipal Mapis", "Museo de la Piedra Emma Occhi", "Museo Miguel Stoessel Müller", "Museo Municipal de Hinojo"] },
  { slug: "polo-la-maxima", nombre: "Polo La Máxima", descripcion: "Educación ambiental, ciencia, tecnología y biodiversidad.", icono: Trees, color: "green", espacios: ["Bioparque La Máxima", "Museo de las Ciencias", "CIIT", "Reserva Natural Municipal Urbana", "GOCO"] },
  { slug: "centros-culturales", nombre: "Centros culturales", descripcion: "Programación, muestras, talleres y gestión de espacios.", icono: Building2, color: "orange", espacios: ["Centro Cultural San José", "Casa del Bicentenario", "Centro Cultural Hinojo", "Centro Cultural Sierras Bayas"] },
  { slug: "educacion-artistica", nombre: "Educación artística", descripcion: "Escuelas municipales, sedes, talleres y propuestas educativas.", icono: GraduationCap, color: "blue", espacios: ["Música", "Teatro", "Danza", "Plástica", "Cerámica", "Literatura", "Ajedrez", "Orfebrería", "Artística Integrada"] },
  { slug: "teatro-municipal", nombre: "Teatro Municipal", descripcion: "Programación, sala, producción, equipo y necesidades técnicas.", icono: Theater, color: "red", espacios: ["Teatro Municipal"] },
  { slug: "eventos", nombre: "Eventos", descripcion: "Producción transversal, fiestas populares, logística y articulaciones.", icono: PartyPopper, color: "pink", espacios: ["Gestión cultural", "Producción", "Logística"] },
];

export const accesos = [
  { href: "/mapa", titulo: "Mapa cultural", detalle: "Espacios y actividad en el territorio", icono: MapPinned },
  { href: "/agenda", titulo: "Agenda unificada", detalle: "Programación de todas las áreas", icono: CalendarDays },
  { href: "/eventos", titulo: "Eventos y reuniones", detalle: "Alta y seguimiento de actividades", icono: PartyPopper },
  { href: "/registros", titulo: "Bitácora", detalle: "Historial y memoria institucional", icono: FileClock },
  { href: "/documentos", titulo: "Base documental", detalle: "Fuentes, vigencia y responsables", icono: Archive },
];
