"use client";

import { Trash2 } from "lucide-react";
import { eliminarSolicitud } from "@/app/(plataforma)/solicitudes/actions";

export function DeleteRequestButton({ id, titulo }: { id: string; titulo: string }) {
  return <form
    action={eliminarSolicitud}
    onSubmit={(event) => {
      if (!window.confirm(`¿Eliminar definitivamente la solicitud “${titulo}”?`)) event.preventDefault();
    }}
  >
    <input type="hidden" name="id" value={id}/>
    <button className="request-action danger" type="submit" aria-label={`Eliminar solicitud: ${titulo}`} title="Eliminar solicitud"><Trash2 size={16}/><span>Eliminar</span></button>
  </form>;
}
