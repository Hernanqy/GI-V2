"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";


function texto(
  formData: FormData,
  campo: string,
) {
  const valor =
    formData.get(campo);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}


function numeroOpcional(
  formData: FormData,
  campo: string,
) {
  const valor =
    texto(
      formData,
      campo,
    );

  if (!valor) {
    return null;
  }

  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero < 0
  ) {
    throw new Error(
      "La cantidad debe ser un número entero positivo.",
    );
  }

  return numero;
}


async function contextoCoordinacion() {

  const supabase =
    await createClient();

  const {
    data: identidad,
    error,
  } =
    await supabase.auth.getClaims();

  const userId =
    identidad?.claims?.sub;

  if (
    error ||
    !userId
  ) {
    return null;
  }

  const { data: perfil } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

  if (
    perfil?.role !==
    "coordinacion"
  ) {
    return null;
  }

  return {
    supabase,
    db: supabase as any,
    userId,
  };
}


function revalidar(
  slug: string,
) {
  revalidatePath(
    `/areas/${slug}`,
  );

  revalidatePath("/areas");
  revalidatePath("/mapa");
  revalidatePath("/agenda");
  revalidatePath("/asistente");
}


export async function guardarFichaOperativa(
  formData: FormData,
) {

  const contexto =
    await contextoCoordinacion();

  if (!contexto) {
    throw new Error(
      "No tenés permisos para editar esta información.",
    );
  }


  const spaceId =
    texto(
      formData,
      "space_id",
    );

  const areaId =
    texto(
      formData,
      "area_id",
    );

  const slug =
    texto(
      formData,
      "slug",
    );

  const name =
    texto(
      formData,
      "name",
    );

  const spaceType =
    texto(
      formData,
      "space_type",
    );

  const responsible =
    texto(
      formData,
      "responsible_name",
    );

  const contact =
    texto(
      formData,
      "public_contact",
    );

  const status =
    texto(
      formData,
      "operational_status",
    );

  const locality =
    texto(
      formData,
      "locality",
    );

  const address =
    texto(
      formData,
      "address",
    );

  const hours =
    texto(
      formData,
      "opening_hours",
    );

  const notes =
    texto(
      formData,
      "management_notes",
    );

  const metricMonth =
    texto(
      formData,
      "metric_month",
    );

  const metricKind =
    texto(
      formData,
      "metric_kind",
    );

  const metricValue =
    numeroOpcional(
      formData,
      "metric_value",
    );


  if (
    !spaceId ||
    !areaId ||
    name.length < 2
  ) {
    throw new Error(
      "Revisá los datos del espacio.",
    );
  }


  const estadosPermitidos =
    new Set([
      "activo",
      "actividad_parcial",
      "cerrado_temporalmente",
      "sin_referente",
      "a_confirmar",
    ]);


  const estadoFinal =
    estadosPermitidos.has(
      status,
    )
      ? status
      : "a_confirmar";


  const {
    data: actual,
    error: actualError,
  } =
    await contexto.db
      .from("spaces")
      .select(
        "id, locality, address",
      )
      .eq("id", spaceId)
      .eq("area_id", areaId)
      .maybeSingle();


  if (
    actualError ||
    !actual
  ) {
    throw new Error(
      "No se encontró el espacio.",
    );
  }


  const cambioUbicacion =
    (actual.locality ?? "") !==
      locality ||
    (actual.address ?? "") !==
      address;


  const actualizacion:
    Record<string, unknown> = {

      name,

      space_type:
        spaceType || null,

      responsible_name:
        responsible || null,

      public_contact:
        contact || null,

      operational_status:
        estadoFinal,

      locality:
        locality || null,

      address:
        address || null,

      opening_hours:
        hours || null,

      management_notes:
        notes || null,

      updated_at:
        new Date().toISOString(),
    };


  /*
   * Si cambia la dirección,
   * no dejamos coordenadas viejas
   * apuntando a otro lugar.
   */
  if (cambioUbicacion) {

    actualizacion.latitude =
      null;

    actualizacion.longitude =
      null;

    actualizacion.location_validated =
      false;
  }


  const { error: spaceError } =
    await contexto.db
      .from("spaces")
      .update(
        actualizacion,
      )
      .eq(
        "id",
        spaceId,
      )
      .eq(
        "area_id",
        areaId,
      );


  if (spaceError) {
    console.error(
      "Error actualizando ficha:",
      spaceError.message,
    );

    throw new Error(
      "No se pudo actualizar la ficha.",
    );
  }


  /*
   * MÉTRICA DEL MES
   * Escuelas = participantes.
   * Resto = visitantes.
   */

  if (
    metricMonth &&
    (
      metricKind ===
        "participants" ||
      metricKind ===
        "visitors"
    )
  ) {

    const {
      data: metrica,
    } =
      await contexto.db
        .from(
          "space_monthly_metrics",
        )
        .select("id")
        .eq(
          "space_id",
          spaceId,
        )
        .eq(
          "period_month",
          metricMonth,
        )
        .maybeSingle();


    if (metrica?.id) {

      const payload =
        metricKind ===
          "participants"
          ? {
              participants_count:
                metricValue,

              updated_at:
                new Date().toISOString(),
            }
          : {
              visitors_count:
                metricValue,

              updated_at:
                new Date().toISOString(),
            };


      const { error } =
        await contexto.db
          .from(
            "space_monthly_metrics",
          )
          .update(payload)
          .eq(
            "id",
            metrica.id,
          );


      if (error) {
        throw new Error(
          "La ficha se guardó, pero no se pudo actualizar la estadística mensual.",
        );
      }

    }
    else if (
      metricValue !== null
    ) {

      const payload:
        Record<string, unknown> = {

        space_id:
          spaceId,

        period_month:
          metricMonth,

        created_by:
          contexto.userId,
      };


      if (
        metricKind ===
        "participants"
      ) {
        payload.participants_count =
          metricValue;
      }
      else {
        payload.visitors_count =
          metricValue;
      }


      const { error } =
        await contexto.db
          .from(
            "space_monthly_metrics",
          )
          .insert(
            payload,
          );


      if (error) {
        throw new Error(
          "La ficha se guardó, pero no se pudo cargar la estadística mensual.",
        );
      }
    }
  }


  revalidar(slug);
}


export async function guardarSede(
  formData: FormData,
) {

  const contexto =
    await contextoCoordinacion();

  if (!contexto) {
    throw new Error(
      "No tenés permisos para editar sedes.",
    );
  }


  const id =
    texto(
      formData,
      "location_id",
    );

  const spaceId =
    texto(
      formData,
      "space_id",
    );

  const slug =
    texto(
      formData,
      "slug",
    );

  const venueName =
    texto(
      formData,
      "venue_name",
    );

  const locality =
    texto(
      formData,
      "locality",
    );

  const address =
    texto(
      formData,
      "address",
    );

  const schedule =
    texto(
      formData,
      "schedule_text",
    );

  const isPrimary =
    formData.get(
      "is_primary",
    ) === "on";


  if (
    !id ||
    !spaceId ||
    venueName.length < 2
  ) {
    throw new Error(
      "Revisá los datos de la sede.",
    );
  }


  const {
    data: actual,
    error: actualError,
  } =
    await contexto.db
      .from("space_locations")
      .select(
        "id, address, locality",
      )
      .eq(
        "id",
        id,
      )
      .eq(
        "space_id",
        spaceId,
      )
      .maybeSingle();


  if (
    actualError ||
    !actual
  ) {
    throw new Error(
      "No se encontró la sede.",
    );
  }


  if (isPrimary) {

    await contexto.db
      .from(
        "space_locations",
      )
      .update({
        is_primary: false,
      })
      .eq(
        "space_id",
        spaceId,
      )
      .neq(
        "id",
        id,
      );
  }


  const cambioUbicacion =
    (actual.address ?? "") !==
      address ||
    (actual.locality ?? "") !==
      locality;


  const payload:
    Record<string, unknown> = {

    venue_name:
      venueName,

    locality:
      locality || null,

    address:
      address || null,

    schedule_text:
      schedule || null,

    is_primary:
      isPrimary,

    updated_at:
      new Date().toISOString(),
  };


  if (cambioUbicacion) {

    payload.latitude =
      null;

    payload.longitude =
      null;

    payload.location_validated =
      false;
  }


  const { error } =
    await contexto.db
      .from(
        "space_locations",
      )
      .update(payload)
      .eq(
        "id",
        id,
      )
      .eq(
        "space_id",
        spaceId,
      );


  if (error) {
    console.error(
      "Error actualizando sede:",
      error.message,
    );

    throw new Error(
      "No se pudo actualizar la sede.",
    );
  }


  revalidar(slug);
}


export async function crearSede(
  formData: FormData,
) {

  const contexto =
    await contextoCoordinacion();

  if (!contexto) {
    throw new Error(
      "No tenés permisos para crear sedes.",
    );
  }


  const spaceId =
    texto(
      formData,
      "space_id",
    );

  const slug =
    texto(
      formData,
      "slug",
    );

  const venueName =
    texto(
      formData,
      "venue_name",
    );

  const locality =
    texto(
      formData,
      "locality",
    );

  const address =
    texto(
      formData,
      "address",
    );

  const schedule =
    texto(
      formData,
      "schedule_text",
    );

  const isPrimary =
    formData.get(
      "is_primary",
    ) === "on";


  if (
    !spaceId ||
    venueName.length < 2
  ) {
    throw new Error(
      "Indicá un nombre para la sede.",
    );
  }


  if (isPrimary) {

    await contexto.db
      .from(
        "space_locations",
      )
      .update({
        is_primary: false,
      })
      .eq(
        "space_id",
        spaceId,
      );
  }


  const { error } =
    await contexto.db
      .from(
        "space_locations",
      )
      .insert({

        space_id:
          spaceId,

        venue_name:
          venueName,

        locality:
          locality || null,

        address:
          address || null,

        schedule_text:
          schedule || null,

        is_primary:
          isPrimary,

        location_validated:
          false,

        active:
          true,
      });


  if (error) {
    console.error(
      "Error creando sede:",
      error.message,
    );

    throw new Error(
      "No se pudo crear la sede.",
    );
  }


  revalidar(slug);
}