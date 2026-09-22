"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  createClient,
} from "@/lib/supabase/server";

import type {
  Database,
} from "@/lib/supabase/database.types";


type EntryKind =
  Database["public"]["Enums"]["entry_kind"];

type Priority =
  Database["public"]["Enums"]["priority_level"];


export type RegistrarEstado = {
  ok: boolean;
  mensaje: string;
};


const tiposPermitidos =
  new Set<EntryKind>([
    "evento",
    "solicitud",
    "reunion",
    "nota",
    "actualizacion",
  ]);


const prioridadesPermitidas =
  new Set<Priority>([
    "normal",
    "alta",
    "compromiso_prioritario",
  ]);


function leerTexto(
  formData: FormData,
  campo: string,
) {

  const valor =
    formData.get(campo);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}


export async function registrarEntrada(
  _estadoAnterior: RegistrarEstado,
  formData: FormData,
): Promise<RegistrarEstado> {

  const supabase =
    await createClient();


  const {
    data: identidad,
    error: errorIdentidad,
  } =
    await supabase.auth.getClaims();


  const userId =
    identidad?.claims?.sub;


  if (
    errorIdentidad ||
    !userId
  ) {
    return {
      ok: false,
      mensaje:
        "La sesión venció. Volvé a ingresar.",
    };
  }


  const kind =
    leerTexto(
      formData,
      "kind",
    ) as EntryKind;


  const areaId =
    leerTexto(
      formData,
      "area_id",
    );


  const spaceId =
    leerTexto(
      formData,
      "space_id",
    );


  const title =
    leerTexto(
      formData,
      "title",
    );


  const details =
    leerTexto(
      formData,
      "details",
    );


  const dueDate =
    leerTexto(
      formData,
      "due_date",
    );


  const startsAtLocal =
    leerTexto(
      formData,
      "starts_at",
    );


  const endsAtLocal =
    leerTexto(
      formData,
      "ends_at",
    );


  const agendaCategory =
    leerTexto(
      formData,
      "agenda_category",
    );


  const priority =
    leerTexto(
      formData,
      "priority",
    ) as Priority;


  if (
    !tiposPermitidos.has(
      kind,
    ) ||
    !prioridadesPermitidas.has(
      priority,
    )
  ) {
    return {
      ok: false,
      mensaje:
        "Revisá el tipo de registro y la prioridad.",
    };
  }


  if (
    !areaId ||
    title.length < 3 ||
    details.length < 3
  ) {
    return {
      ok: false,
      mensaje:
        "Completá la dependencia, el título y el detalle.",
    };
  }


  if (
    dueDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dueDate,
    )
  ) {
    return {
      ok: false,
      mensaje:
        "La fecha ingresada no es válida.",
    };
  }


  const esAgenda =
    kind === "evento" ||
    kind === "reunion";


  const formatoFechaHora =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;


  if (
    esAgenda &&
    !formatoFechaHora.test(
      startsAtLocal,
    )
  ) {
    return {
      ok: false,
      mensaje:
        "Indicá la fecha y hora de inicio.",
    };
  }


  if (
    endsAtLocal &&
    !formatoFechaHora.test(
      endsAtLocal,
    )
  ) {
    return {
      ok: false,
      mensaje:
        "La fecha y hora de finalización no es válida.",
    };
  }


  const startsAt =
    esAgenda
      ? `${startsAtLocal}:00-03:00`
      : null;


  const endsAt =
    esAgenda &&
    endsAtLocal
      ? `${endsAtLocal}:00-03:00`
      : null;


  if (
    startsAt &&
    endsAt &&
    new Date(
      endsAt,
    ).getTime() <
    new Date(
      startsAt,
    ).getTime()
  ) {
    return {
      ok: false,
      mensaje:
        "La finalización no puede ser anterior al inicio.",
    };
  }


  const {
    data: area,
  } =
    await supabase
      .from("areas")
      .select(
        "id, slug",
      )
      .eq(
        "id",
        areaId,
      )
      .eq(
        "active",
        true,
      )
      .maybeSingle();


  if (!area) {
    return {
      ok: false,
      mensaje:
        "La dependencia seleccionada no está disponible.",
    };
  }


  if (spaceId) {

    const {
      data: espacio,
    } =
      await supabase
        .from("spaces")
        .select("id")
        .eq(
          "id",
          spaceId,
        )
        .eq(
          "area_id",
          areaId,
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
          "El espacio no corresponde a la dependencia elegida.",
      };
    }
  }


  const metadata =
    esAgenda
      ? {
          agenda_category:
            agendaCategory ||
            (
              kind === "reunion"
                ? "reunion"
                : "evento"
            ),

          missing_fields: [],
        }
      : {};


  const { error } =
    await supabase
      .from("entries")
      .insert({
        kind,
        title,
        details,
        area_id:
          areaId,
        space_id:
          spaceId || null,
        status:
          "pendiente",
        priority,
        visibility:
          "area",

        due_date:
          esAgenda
            ? startsAtLocal.slice(
                0,
                10,
              )
            : dueDate || null,

        starts_at:
          startsAt,

        ends_at:
          endsAt,

        metadata,

        created_by:
          userId,

        updated_by:
          userId,
      });


  if (error) {

    console.error(
      "No se pudo registrar la entrada",
      error.message,
    );

    return {
      ok: false,
      mensaje:
        "No se pudo guardar. Verificá los datos e intentá nuevamente.",
    };
  }


  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/eventos");
  revalidatePath("/solicitudes");
  revalidatePath("/registros");

  revalidatePath(
    `/areas/${area.slug}`,
  );


  return {
    ok: true,

    mensaje:
      kind === "solicitud"
        ? "Solicitud registrada correctamente."
        : (
            kind === "nota" ||
            kind === "actualizacion"
          )
          ? "Registro incorporado a la Bitácora."
          : "Registro guardado correctamente.",
  };
}