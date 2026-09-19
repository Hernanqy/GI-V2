import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { obtenerAreas } from "@/lib/areas-data";
import { createClient } from "@/lib/supabase/server";

export default async function PlataformaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) redirect("/login");

  const [{ data: perfil }, areas] = await Promise.all([
    supabase.from("profiles").select("display_name, role").eq("id", data.claims.sub).maybeSingle(),
    obtenerAreas(),
  ]);

  const nombre = perfil?.display_name ?? "Usuario";
  const rol = perfil?.role === "coordinacion" ? "Coordinación" : "Responsable de dependencia";
  const busquedaItems = areas.flatMap((area) => [
    { titulo: area.nombre, detalle: "Dependencia cultural", href: `/areas/${area.slug}` },
    ...area.espacios.map((espacio) => ({ titulo: espacio.nombre, detalle: area.nombre, href: `/areas/${area.slug}` })),
  ]);

  return <AppShell nombreUsuario={nombre} rolUsuario={rol} busquedaItems={busquedaItems}>{children}</AppShell>;
}
