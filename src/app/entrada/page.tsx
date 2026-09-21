import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot } from "lucide-react";

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

  return (
    <main className="gi-choice-page">

      <div className="gi-choice-wrap">

        <div className="gi-choice-brand">
          Cultura · Olavarría
        </div>


        <div className="gi-choice-grid">

          <Link
            href="/asistente"
            className="gi-choice-item"
          >

            <span className="gi-choice-icon assistant">
              <Bot size={44} />
            </span>

            <strong>
              Asistente virtual
            </strong>

          </Link>


          <Link
            href="/"
            className="gi-choice-item"
          >

            <span className="gi-choice-icon gi">
              GI
            </span>

            <strong>
              GI
            </strong>

          </Link>

        </div>

      </div>

    </main>
  );
}