import { LockKeyhole, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { iniciarSesion } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims?.sub) redirect("/entrada");

  const { error } = await searchParams;

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span className="brand-mark">GI</span>
          <div>
            <strong>Cultura · Olavarría</strong>
            <small>Gestión institucional</small>
          </div>
        </div>
        <div className="login-heading">
          <span className="eyebrow">Acceso interno</span>
          <h1>Ingresar a la plataforma</h1>
          <p>Usá el usuario y la contraseña asignados por Coordinación.</p>
        </div>
        {error ? <p className="login-error" role="alert">{error}</p> : null}
        <form action={iniciarSesion} className="login-form">
          <label>
            <span>Usuario</span>
            <div className="login-input">
              <UserRound size={19} />
              <input name="usuario" autoComplete="username" required minLength={3} autoFocus />
            </div>
          </label>
          <label>
            <span>Contraseña</span>
            <div className="login-input">
              <LockKeyhole size={19} />
              <input name="password" type="password" autoComplete="current-password" required minLength={6} />
            </div>
          </label>
          <button className="button primary login-submit" type="submit">Ingresar</button>
        </form>
      </section>
    </main>
  );
}
