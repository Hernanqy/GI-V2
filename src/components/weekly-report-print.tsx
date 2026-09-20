"use client";

import { Printer } from "lucide-react";

export function WeeklyReportPrint() {
  return (
    <button
      className="button weekly-print-button"
      type="button"
      onClick={() => window.print()}
    >
      <Printer size={16} />
      Imprimir / Guardar PDF
    </button>
  );
}