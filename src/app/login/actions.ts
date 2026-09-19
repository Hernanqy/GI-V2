"use server";

import { redirect } from "next/navigation";
import { normalizarUsuario, usuarioAEmail, usuarioValido } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function iniciarSesion(formData: FormData) {
  const usuario = normalizarUsuario(String(formData.get("usuario") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!usuarioValido(usuario) || password.length < 6) {
    redirect("/login?error=Usuario%20o%20contrase%C3%B1a%20incorrectos");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usuarioAEmail(usuario),
    password,
  });

  if (error) {
    redirect("/login?error=Usuario%20o%20contrase%C3%B1a%20incorrectos");
  }

  redirect("/");
}
