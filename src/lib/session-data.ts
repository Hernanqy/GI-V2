import { createClient } from "@/lib/supabase/server";

export type PerfilActual = {
  id: string;
  nombre: string;
  rol: "coordinacion" | "responsable_area";
  areaId: string | null;
};

export async function obtenerPerfilActual(): Promise<PerfilActual | null> {
  const supabase = await createClient();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getClaims();
  const userId = identidad?.claims?.sub;

  if (errorIdentidad || !userId) return null;

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("display_name, role, area_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !perfil) return null;

  return {
    id: userId,
    nombre: perfil.display_name,
    rol: perfil.role,
    areaId: perfil.area_id,
  };
}
