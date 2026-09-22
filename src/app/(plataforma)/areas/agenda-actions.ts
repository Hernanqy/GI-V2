"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";


export type AgendaQuickState = {
  ok: boolean;
  mensaje: string;
};


function texto(
  formData: FormData,
  nombre: string,
) {
  const valor =
    formData.get(nombre);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}


const estados =
  new Set([
    "borrador",
    "pendiente",
    "confirmado",
    "completado",
  ]);


const categorias =
  new Set([
    "evento",
    "taller",
    "propuesta_educativa",
    "reunion",
    "otro",
  ]);


export async function actualizarAgendaRapida(
  entryId: string,
  _estadoAnterior: AgendaQuickState,
  formData: FormData,
): Promise<AgendaQuickState> {

  const supabase =
    await createClient();

  const db =
    supabase as any;


  const {
    data: identidad,
    error: authError,
  } =
    await supabase.auth.getClaims();


  const userId =
    identidad?.claims?.sub;


  if (
    authError ||
    !userId
  ) {
    return {
      ok: false,
      mensaje:
        "La sesión venció. Volvé a ingresar.",
    };
  }


  const title =
    texto(
      formData,
      "title",
    );

  const fecha =
    texto(
      formData,
      "date",
    );

  const hora =
    texto(
      formData,
      "time",
    );

  const status =
    texto(
      formData,
      "status",
    );

  const categoria =
    texto(
      formData,
      "category",
    );

  const spaceId =
    texto(
      formData,
      "space_id",
    );

  const details =
    texto(
      formData,
      "details",
    );


  if (
    title.length < 3
  ) {
    return {
      ok: false,
      mensaje:
        "El título debe tener al menos 3 caracteres.",
    };
  }


  if (
    fecha &&
    !/^\d{4}-\d{2}-\d{2}$/.test(
      fecha,
    )
  ) {
    return {
      ok: false,
      mensaje:
        "La fecha no es válida.",
    };
  }


  if (
    hora &&
    !/^\d{2}:\d{2}$/.test(
      hora,
    )
  ) {
    return {
      ok: false,
      mensaje:
        "La hora no es válida.",
    };
  }


  if (
    hora &&
    !fecha
  ) {
    return {
      ok: false,
      mensaje:
        "Para cargar una hora primero indicá la fecha.",
    };
  }


  if (
    !estados.has(
      status,
    )
  ) {
    return {
      ok: false,
      mensaje:
        "El estado seleccionado no es válido.",
    };
  }


  if (
    !categorias.has(
      categoria,
    )
  ) {
    return {
      ok: false,
      mensaje:
        "El tipo de actividad no es válido.",
    };
  }


  const {
    data: entrada,
    error: entradaError,
  } =
    await db
      .from("entries")
      .select(
        "id, area_id, metadata",
      )
      .eq(
        "id",
        entryId,
      )
      .maybeSingle();


  if (
    entradaError ||
    !entrada
  ) {
    return {
      ok: false,
      mensaje:
        "No se encontró la actividad.",
    };
  }


  if (spaceId) {

    const {
      data: espacio,
    } =
      await db
        .from("spaces")
        .select("id")
        .eq(
          "id",
          spaceId,
        )
        .eq(
          "area_id",
          entrada.area_id,
        )
        .eq(
          "active",
          true,
        )
        .maybeSingle();


    if (!espacio) {
      return {
        ok: false,
        mensaje:
          "El espacio seleccionado no corresponde a esta dependencia.",
      };
    }
  }


  const metadata =
    entrada.metadata &&
    typeof entrada.metadata === "object"
      ? {
          ...entrada.metadata,
        }
      : {};


  const faltantes =
    new Set<string>(
      Array.isArray(
        metadata.missing_fields,
      )
        ? metadata.missing_fields.filter(
            (
              item: unknown,
            ): item is string =>
              typeof item === "string",
          )
        : [],
    );


  /*
   * Solo actualizamos los faltantes que
   * realmente podemos resolver desde esta ficha.
   * Los avisos especiales importados del Word
   * se conservan.
   */

  faltantes.delete("fecha");
  faltantes.delete("hora");
  faltantes.delete("detalle");
  faltantes.delete("espacio");


  if (!fecha) {
    faltantes.add("fecha");
  }


  if (
    fecha &&
    !hora
  ) {
    faltantes.add("hora");
  }


  if (!details) {
    faltantes.add("detalle");
  }


  metadata.agenda_category =
    categoria;

  metadata.missing_fields =
    [...faltantes];


  const startsAt =
    fecha && hora
      ? `${fecha}T${hora}:00-03:00`
      : null;


  const { error } =
    await db
      .from("entries")
      .update({
        title,
        details:
          details || null,

        due_date:
          fecha || null,

        starts_at:
          startsAt,

        status,

        space_id:
          spaceId || null,

        metadata,

        updated_by:
          userId,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        entryId,
      );


  if (error) {

    console.error(
      "Error actualizando agenda:",
      error.message,
    );

    return {
      ok: false,
      mensaje:
        "No se pudieron guardar los cambios.",
    };
  }


  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/eventos");

  /*
   * Revalida todas las fichas de dependencias.
   */
  revalidatePath(
    "/areas",
    "layout",
  );


  return {
    ok: true,
    mensaje:
      "Cambios guardados.",
  };
}