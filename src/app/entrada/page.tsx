import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  Bot,
  CalendarDays,
  LayoutDashboard,
  MapPinned,
  Mic,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function EntradaPage() {

  const supabase =
    await createClient();

  const { data, error } =
    await supabase.auth.getClaims();

  if (
    error ||
    !data?.claims?.sub
  ) {
    redirect("/login");
  }

  const { data: perfil } =
    await supabase
      .from("profiles")
      .select("display_name")
      .eq(
        "id",
        data.claims.sub,
      )
      .maybeSingle();

  const nombre =
    perfil?.display_name ||
    "Usuario";

  return (
    <main className="gi-entry-page">

      <div className="gi-entry-shell">

        <header className="gi-entry-header">

          <div className="gi-entry-brand">

            <span className="brand-mark">
              GI
            </span>

            <div>
              <strong>
                Cultura · Olavarría
              </strong>

              <small>
                Gestión institucional
              </small>
            </div>

          </div>

          <div className="gi-entry-user">
            <small>
              Bienvenido
            </small>

            <strong>
              {nombre}
            </strong>
          </div>

        </header>


        <section className="gi-entry-intro">

          <span className="eyebrow">
            Acceso rápido
          </span>

          <h1>
            ¿Qué necesitás hacer?
          </h1>

          <p>
            Entrá directamente al Asistente de Cultura
            para consultar por voz o texto, o ingresá
            a la plataforma completa de gestión.
          </p>

        </section>


        <section className="gi-entry-options">

          <Link
            href="/asistente"
            className="gi-entry-card gi-entry-assistant"
          >

            <div className="gi-entry-card-top">

              <span className="gi-entry-main-icon">
                <Bot size={32} />
              </span>

              <span className="gi-entry-badge">
                <Mic size={14} />
                Voz disponible
              </span>

            </div>


            <div className="gi-entry-card-content">

              <span className="eyebrow">
                Consulta rápida
              </span>

              <h2>
                Asistente de Cultura
              </h2>

              <p>
                Preguntá por espacios, responsables,
                personal, escuelas, sedes, horarios,
                agenda y otra información cargada en GI.
              </p>

            </div>


            <div className="gi-entry-card-action">

              <span>
                Entrar al asistente
              </span>

              <ArrowRight size={20} />

            </div>

          </Link>


          <Link
            href="/"
            className="gi-entry-card gi-entry-platform"
          >

            <div className="gi-entry-card-top">

              <span className="gi-entry-main-icon">
                <LayoutDashboard size={30} />
              </span>

              <span className="gi-entry-badge neutral">
                Gestión completa
              </span>

            </div>


            <div className="gi-entry-card-content">

              <span className="eyebrow">
                Plataforma
              </span>

              <h2>
                Gestión Institucional
              </h2>

              <p>
                Accedé a dependencias, personal,
                mapa cultural, agenda, eventos,
                documentos, solicitudes e informes.
              </p>

            </div>


            <div className="gi-entry-features">

              <span>
                <CalendarDays size={16} />
                Agenda
              </span>

              <span>
                <MapPinned size={16} />
                Mapa
              </span>

              <span>
                <Users size={16} />
                Personal
              </span>

            </div>


            <div className="gi-entry-card-action">

              <span>
                Entrar a GI
              </span>

              <ArrowRight size={20} />

            </div>

          </Link>

        </section>


        <p className="gi-entry-tip">

          En el teléfono, si estás en una reunión,
          podés entrar directamente al Asistente
          y hacer la consulta usando el micrófono.

        </p>

      </div>

    </main>
  );
}