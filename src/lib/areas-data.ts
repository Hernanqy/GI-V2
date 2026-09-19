import {
  Building2,
  GraduationCap,
  Landmark,
  PartyPopper,
  Theater,
  Trees,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type AreaVisual = {
  icono: LucideIcon;
  color: string;
};

const visuales: Record<string, AreaVisual> = {
  "patrimonio-cultural": { icono: Landmark, color: "violet" },
  "polo-la-maxima": { icono: Trees, color: "green" },
  "centros-culturales": { icono: Building2, color: "orange" },
  "educacion-artistica": { icono: GraduationCap, color: "blue" },
  "teatro-municipal": { icono: Theater, color: "red" },
  eventos: { icono: PartyPopper, color: "pink" },
};

const visualPredeterminado: AreaVisual = {
  icono: Building2,
  color: "green",
};

export type EspacioCultural = {
  id: string;
  nombre: string;
  tipo: string;
  localidad: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  ubicacionValidada: boolean;
};

export type AreaConEspacios = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  espacios: EspacioCultural[];
  icono: LucideIcon;
  color: string;
};

export async function obtenerAreas(): Promise<AreaConEspacios[]> {
  const supabase = await createClient();
  const [areasResult, espaciosResult] = await Promise.all([
    supabase
      .from("areas")
      .select("id, slug, name, description")
      .eq("active", true)
      .order("name"),
    supabase
      .from("spaces")
      .select("id, area_id, name, space_type, locality, address, latitude, longitude, location_validated")
      .eq("active", true)
      .order("name"),
  ]);

  if (areasResult.error) {
    throw new Error(`No se pudieron cargar las dependencias: ${areasResult.error.message}`);
  }

  if (espaciosResult.error) {
    throw new Error(`No se pudieron cargar los espacios: ${espaciosResult.error.message}`);
  }

  return areasResult.data.map((area) => {
    const visual = visuales[area.slug] ?? visualPredeterminado;

    return {
      id: area.id,
      slug: area.slug,
      nombre: area.name,
      descripcion: area.description ?? "Sin descripción institucional cargada.",
      espacios: espaciosResult.data
        .filter((espacio) => espacio.area_id === area.id)
        .map((espacio) => ({
          id: espacio.id,
          nombre: espacio.name,
          tipo: espacio.space_type ?? "",
          localidad: espacio.locality ?? "",
          direccion: espacio.address ?? "",
          latitud: espacio.latitude,
          longitud: espacio.longitude,
          ubicacionValidada: espacio.location_validated,
        })),
      ...visual,
    };
  });
}
