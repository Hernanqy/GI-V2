"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bot,
  LoaderCircle,
  Mic,
  Send,
  Sparkles,
  Square,
  UserRound,
} from "lucide-react";


type Mensaje = {
  role: "user" | "assistant";
  content: string;
};


const sugerencias = [
  "¿Qué actividades próximas tiene Patrimonio?",
  "¿Dónde funciona la Escuela Municipal de Teatro?",
  "¿Quiénes trabajan en el Museo Dámaso Arce?",
  "¿Qué espacios tienen información incompleta?",
];


function extensionAudio(
  mimeType: string,
) {
  if (
    mimeType.includes("mp4") ||
    mimeType.includes("m4a")
  ) {
    return "m4a";
  }

  if (
    mimeType.includes("ogg")
  ) {
    return "ogg";
  }

  if (
    mimeType.includes("wav")
  ) {
    return "wav";
  }

  return "webm";
}


export function CultureAssistant() {

  const [mensajes, setMensajes] =
    useState<Mensaje[]>([
      {
        role: "assistant",
        content:
          "Hola. Puedo consultar la información cargada en GI sobre dependencias, espacios, escuelas, sedes, personal, agenda y datos operativos.",
      },
    ]);


  const [texto, setTexto] =
    useState("");


  const [enviando, setEnviando] =
    useState(false);


  const [grabando, setGrabando] =
    useState(false);


  const [transcribiendo, setTranscribiendo] =
    useState(false);


  const [errorAudio, setErrorAudio] =
    useState("");


  const recorderRef =
    useRef<MediaRecorder | null>(
      null,
    );


  const streamRef =
    useRef<MediaStream | null>(
      null,
    );


  const chunksRef =
    useRef<Blob[]>([]);


  useEffect(() => {

    return () => {

      streamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop(),
        );

    };

  }, []);


  async function consultar(
    consulta: string,
  ) {

    const limpio =
      consulta.trim();


    if (
      !limpio ||
      enviando
    ) {
      return;
    }


    const mensajeUsuario:
      Mensaje = {
        role: "user",
        content: limpio,
      };


    const historial =
      mensajes.slice(-8);


    setMensajes(
      (actual) => [
        ...actual,
        mensajeUsuario,
      ],
    );


    setTexto("");

    setEnviando(true);


    try {

      const respuesta =
        await fetch(
          "/api/asistente",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                message: limpio,
                history: historial,
              }),
          },
        );


      const data =
        await respuesta.json();


      if (
        !respuesta.ok
      ) {

        throw new Error(
          data?.error ||
          "No se pudo consultar.",
        );

      }


      setMensajes(
        (actual) => [
          ...actual,
          {
            role:
              "assistant",

            content:
              data.answer ||
              "No encontré una respuesta.",
          },
        ],
      );

    }
    catch (error) {

      setMensajes(
        (actual) => [
          ...actual,
          {
            role:
              "assistant",

            content:
              error
                instanceof Error
                ? error.message
                : "No se pudo consultar el asistente.",
          },
        ],
      );

    }
    finally {

      setEnviando(false);

    }

  }


  async function procesarAudio(
    blob: Blob,
    mimeType: string,
  ) {

    if (
      blob.size < 500
    ) {

      setErrorAudio(
        "La grabación fue demasiado corta.",
      );

      return;

    }


    setTranscribiendo(true);

    setErrorAudio("");


    try {

      const extension =
        extensionAudio(
          mimeType,
        );


      const archivo =
        new File(
          [blob],
          `consulta-gi.${extension}`,
          {
            type:
              mimeType ||
              "audio/webm",
          },
        );


      const formData =
        new FormData();


      formData.append(
        "audio",
        archivo,
      );


      const respuesta =
        await fetch(
          "/api/transcribir",
          {
            method: "POST",

            body:
              formData,
          },
        );


      const data =
        await respuesta.json();


      if (
        !respuesta.ok
      ) {

        throw new Error(
          data?.error ||
          "No se pudo transcribir.",
        );

      }


      const transcripcion =
        String(
          data?.text || "",
        ).trim();


      if (
        !transcripcion
      ) {

        throw new Error(
          "No pude reconocer lo que dijiste.",
        );

      }


      /*
       * Mostramos brevemente
       * la transcripción y
       * la enviamos automáticamente.
       */

      setTexto(
        transcripcion,
      );


      await consultar(
        transcripcion,
      );

    }
    catch (error) {

      setErrorAudio(
        error
          instanceof Error
          ? error.message
          : "No se pudo procesar el audio.",
      );

    }
    finally {

      setTranscribiendo(false);

    }

  }


  async function iniciarGrabacion() {

    if (
      grabando ||
      transcribiendo ||
      enviando
    ) {
      return;
    }


    setErrorAudio("");


    if (
      typeof navigator ===
        "undefined" ||
      !navigator.mediaDevices
        ?.getUserMedia
    ) {

      setErrorAudio(
        "Este navegador no permite usar el micrófono.",
      );

      return;

    }


    if (
      typeof MediaRecorder ===
      "undefined"
    ) {

      setErrorAudio(
        "La grabación de audio no está disponible en este navegador.",
      );

      return;

    }


    try {

      const stream =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: true,
          });


      streamRef.current =
        stream;


      /*
       * Dejamos que el teléfono
       * elija su formato nativo.
       *
       * Chrome/Android suele usar WebM.
       * Safari/iPhone suele elegir MP4.
       */

      const recorder =
        new MediaRecorder(
          stream,
        );


      recorderRef.current =
        recorder;


      chunksRef.current =
        [];


      recorder.ondataavailable =
        (event) => {

          if (
            event.data.size > 0
          ) {

            chunksRef.current.push(
              event.data,
            );

          }

        };


      recorder.onerror =
        () => {

          setErrorAudio(
            "Hubo un problema al grabar.",
          );

        };


      recorder.onstop =
        async () => {

          const mimeType =
            recorder.mimeType ||
            chunksRef.current[0]
              ?.type ||
            "audio/webm";


          const blob =
            new Blob(
              chunksRef.current,
              {
                type:
                  mimeType,
              },
            );


          chunksRef.current =
            [];


          stream
            .getTracks()
            .forEach(
              (track) =>
                track.stop(),
            );


          streamRef.current =
            null;


          recorderRef.current =
            null;


          await procesarAudio(
            blob,
            mimeType,
          );

        };


      recorder.start();

      setGrabando(true);

    }
    catch (error) {

      streamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop(),
        );


      streamRef.current =
        null;


      if (
        error instanceof DOMException &&
        (
          error.name ===
            "NotAllowedError" ||
          error.name ===
            "PermissionDeniedError"
        )
      ) {

        setErrorAudio(
          "Necesito permiso para usar el micrófono.",
        );

      }
      else {

        setErrorAudio(
          "No pude acceder al micrófono.",
        );

      }

    }

  }


  function detenerGrabacion() {

    const recorder =
      recorderRef.current;


    if (
      !recorder ||
      recorder.state ===
        "inactive"
    ) {
      return;
    }


    setGrabando(false);

    recorder.stop();

  }


  function enviar(
    event: FormEvent,
  ) {

    event.preventDefault();

    consultar(texto);

  }


  function teclado(
    event:
      KeyboardEvent<HTMLTextAreaElement>,
  ) {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      consultar(texto);

    }

  }


  const ocupado =
    enviando ||
    transcribiendo;


  return (

    <div
      className="
        culture-assistant
      "
    >

      <section
        className="
          assistant-conversation
        "
      >

        <div
          className="
            assistant-suggestions
          "
        >

          <span>

            <Sparkles
              size={15}
            />

            Probá preguntando

          </span>


          <div>

            {
              sugerencias.map(
                (item) => (

                  <button

                    type="button"

                    key={item}

                    onClick={() =>
                      consultar(item)
                    }

                    disabled={
                      ocupado ||
                      grabando
                    }

                  >

                    {item}

                  </button>

                ),
              )
            }

          </div>

        </div>


        <div
          className="
            assistant-messages
          "
        >

          {
            mensajes.map(
              (
                mensaje,
                index,
              ) => (

                <div

                  key={
                    `${mensaje.role}-${index}`
                  }

                  className={`
                    assistant-message
                    ${mensaje.role}
                  `}
                >

                  <span
                    className="
                      assistant-avatar
                    "
                  >

                    {
                      mensaje.role ===
                      "assistant"

                        ? (
                          <Bot
                            size={18}
                          />
                        )

                        : (
                          <UserRound
                            size={18}
                          />
                        )
                    }

                  </span>


                  <div>

                    <strong>

                      {
                        mensaje.role ===
                        "assistant"

                          ? "Asistente de Cultura"

                          : "Vos"
                      }

                    </strong>


                    <p>
                      {
                        mensaje.content
                      }
                    </p>

                  </div>

                </div>

              ),
            )
          }


          {
            transcribiendo
              ? (

                <div
                  className="
                    assistant-message
                    assistant
                  "
                >

                  <span
                    className="
                      assistant-avatar
                    "
                  >

                    <LoaderCircle
                      className="
                        assistant-spinner
                      "
                      size={18}
                    />

                  </span>


                  <div>

                    <strong>
                      Asistente de Cultura
                    </strong>

                    <p>
                      Transcribiendo tu audio…
                    </p>

                  </div>

                </div>

              )
              : null
          }


          {
            enviando
              ? (

                <div
                  className="
                    assistant-message
                    assistant
                  "
                >

                  <span
                    className="
                      assistant-avatar
                    "
                  >

                    <Bot
                      size={18}
                    />

                  </span>


                  <div>

                    <strong>
                      Asistente de Cultura
                    </strong>

                    <p>
                      Consultando GI…
                    </p>

                  </div>

                </div>

              )
              : null
          }

        </div>


        <form
          className="
            assistant-composer
            assistant-composer-voice
          "
          onSubmit={enviar}
        >

          <textarea

            value={texto}

            onChange={
              (event) =>
                setTexto(
                  event.target.value,
                )
            }

            onKeyDown={
              teclado
            }

            placeholder={
              grabando
                ? "Escuchando..."
                : "Preguntá algo sobre Cultura de Olavarría..."
            }

            rows={3}

            disabled={
              grabando
            }

          />


          <div
            className="
              assistant-composer-actions
            "
          >

            {
              grabando
                ? (

                  <button

                    className="
                      button
                      assistant-mic-button
                      recording
                    "

                    type="button"

                    onClick={
                      detenerGrabacion
                    }

                  >

                    <Square
                      size={17}
                    />

                    Detener

                  </button>

                )
                : (

                  <button

                    className="
                      button
                      assistant-mic-button
                    "

                    type="button"

                    onClick={
                      iniciarGrabacion
                    }

                    disabled={
                      ocupado
                    }

                  >

                    <Mic
                      size={18}
                    />

                    Hablar

                  </button>

                )
            }


            <button

              className="
                button
                primary
              "

              type="submit"

              disabled={
                ocupado ||
                grabando ||
                !texto.trim()
              }

            >

              <Send
                size={17}
              />

              {
                enviando
                  ? "Consultando…"
                  : "Enviar"
              }

            </button>

          </div>


          {
            grabando
              ? (

                <div
                  className="
                    assistant-recording-status
                  "
                >

                  <span />

                  Escuchando…

                </div>

              )
              : null
          }


          {
            errorAudio
              ? (

                <div
                  className="
                    assistant-audio-error
                  "
                >

                  {errorAudio}

                </div>

              )
              : null
          }

        </form>

      </section>

    </div>

  );

}