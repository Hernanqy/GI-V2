import {
  Bot,
  Database,
} from "lucide-react";

import { CultureAssistant } from "@/components/culture-assistant";

export default function AsistentePage() {
  return (
    <div className="page-stack">
      <section className="page-heading assistant-page-heading">
        <div>
          <span className="eyebrow">
            Inteligencia institucional
          </span>

          <h1>
            Asistente de Cultura
          </h1>

          <p>
            Consultá la información actual cargada en GI mediante lenguaje natural.
          </p>
        </div>

        <span className="assistant-page-icon">
          <Bot size={27} />
        </span>
      </section>

      <section className="assistant-source-note">
        <Database size={17} />

        <span>
          Esta primera versión consulta Supabase en modo lectura. No modifica información.
        </span>
      </section>

      <CultureAssistant />
    </div>
  );
}