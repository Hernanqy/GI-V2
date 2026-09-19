"use client";

import { AlertTriangle } from "lucide-react";

export default function AreasError({ reset }: { reset: () => void }) {
  return (
    <div className="page-stack">
      <section className="panel empty-module">
        <span><AlertTriangle size={30} /></span>
        <h2>No se pudo conectar con Supabase</h2>
        <p>Revisá la configuración y volvé a intentar.</p>
        <div><button className="button primary" type="button" onClick={reset}>Reintentar</button></div>
      </section>
    </div>
  );
}
