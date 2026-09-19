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

export type AreaConEspacios = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  espacios: Array<{ id: string; nombre: string }>;
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
      .select("id, area_id, name")
      .eq("active", true)
      .order("name"),
  ]);

  if (areasResult.error) {
    throw new Error(`No se pudieron cargar las áreas: ${areasResult.error.message}`);
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
        .map((espacio) => ({ id: espacio.id, nombre: espacio.name })),
      ...visual,
    };
  });
}
