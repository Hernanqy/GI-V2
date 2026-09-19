"use client";

import { Trash2 } from "lucide-react";
import { eliminarRegistro } from "@/app/(plataforma)/registros/actions";

export function DeleteRecordButton({ id, titulo }: { id: string; titulo: string }) {
  return <form action={eliminarRegistro} onSubmit={(event) => { if (!window.confirm(`¿Eliminar definitivamente “${titulo}”?`)) event.preventDefault(); }}><input type="hidden" name="id" value={id}/><button className="request-action danger" type="submit" aria-label={`Eliminar: ${titulo}`} title="Eliminar"><Trash2 size={16}/><span>Eliminar</span></button></form>;
}
