"use client";

import { Trash2 } from "lucide-react";
import { eliminarEvento } from "@/app/(plataforma)/eventos/actions";

export function DeleteEventButton({ id, titulo }: { id: string; titulo: string }) {
  return <form action={eliminarEvento} onSubmit={(event) => {
    if (!window.confirm(`¿Eliminar definitivamente “${titulo}” de la agenda?`)) event.preventDefault();
  }}>
    <input type="hidden" name="id" value={id}/>
    <button className="request-action danger" type="submit" aria-label={`Eliminar: ${titulo}`} title="Eliminar"><Trash2 size={16}/><span>Eliminar</span></button>
  </form>;
}
