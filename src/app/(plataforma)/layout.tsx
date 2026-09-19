import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function PlataformaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", data.claims.sub)
    .maybeSingle();

  const nombre = perfil?.display_name ?? "Usuario";
  const rol = perfil?.role === "coordinacion" ? "Coordinación" : "Responsable de área";

  return <AppShell nombreUsuario={nombre} rolUsuario={rol}>{children}</AppShell>;
}
