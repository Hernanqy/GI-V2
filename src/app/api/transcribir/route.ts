import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: identidad, error: authError } =
      await supabase.auth.getClaims();

    const userId =
      (identidad?.claims as any)?.sub;

    if (authError || !userId) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Falta configurar OPENAI_API_KEY.",
        },
        { status: 500 },
      );
    }

    const formData =
      await request.formData();

    const audio =
      formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        {
          error:
            "No se recibió una grabación válida.",
        },
        { status: 400 },
      );
    }

    if (audio.size === 0) {
      return NextResponse.json(
        {
          error:
            "La grabación está vacía.",
        },
        { status: 400 },
      );
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        {
          error:
            "La grabación es demasiado larga.",
        },
        { status: 413 },
      );
    }

    const openai =
      new OpenAI({
        apiKey:
          process.env.OPENAI_API_KEY,
      });

    const transcription =
      await openai.audio.transcriptions.create({
        file: audio,

        model:
          "gpt-transcribe",

        prompt:
          "Consulta interna de Cultura del Partido de Olavarría, Argentina. Nombres frecuentes: Olavarría, Dámaso Arce, Museo Hermanos Emiliozzi, Hinojo, Sierras Bayas, Polo La Máxima, GOCO, Educación Artística, Casa del Bicentenario, Centro Cultural San José, Patrimonio Cultural.",
      });

    const texto =
      transcription.text?.trim();

    if (!texto) {
      return NextResponse.json(
        {
          error:
            "No pude reconocer lo que dijiste.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      text: texto,
    });
  }
  catch (error) {
    console.error(
      "Error transcribiendo audio:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo transcribir el audio.",
      },
      { status: 500 },
    );
  }
}