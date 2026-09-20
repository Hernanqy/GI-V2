"use client";

import { useActionState } from "react";
import {
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Contact,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import type { EspacioCultural } from "@/lib/areas-data";
import {
  guardarEspacioDirecto,
  type DirectVenueState,
} from "@/app/(plataforma)/areas/direct-venue-actions";

const inicial: DirectVenueState = { ok: false, mensaje: "" };

const estados: Record<string, string> = {
  activo: "Activo",
  cerrado_temporalmente: "Cerrado temporalmente",
  en_refaccion: "En refacción",
  a_confirmar: "A confirmar",
};

export function DirectVenuePanel({
  areaId,
  slug,
  areaName,
  espacio,
  editable,
}: {
  areaId: string;
  slug: string;
  areaName: string;
  espacio: EspacioCultural | undefined;
  editable: boolean;
}) {
  const [estado, action, pendiente] = useActionState(
    guardarEspacioDirecto,
    inicial,
  );

  if (!espacio) {
    return (
      <section className="panel direct-venue-panel">
        <div className="direct-venue-empty">
          <Building2 size={30} />
          <strong>No se pudo cargar la ficha del espacio</strong>
          <span>
            La dependencia existe, pero falta su registro operativo como espacio cultural.
          </span>
        </div>
      </section>
    );
  }

  if (!editable) {
    return (
      <section className="panel direct-venue-panel">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Ficha del espacio</span>
            <h2>{areaName}</h2>
          </div>
          <span className={`direct-status status-${espacio.estadoOperativo}`}>
            {estados[espacio.estadoOperativo] ?? espacio.estadoOperativo}
          </span>
        </div>

        <div className="direct-venue-readonly">
          <div><MapPin size={17} /><span><strong>Localidad / dirección</strong><small>{[espacio.localidad, espacio.direccion].filter(Boolean).join(" · ") || "Sin dato"}</small></span></div>
          <div><UserRound size={17} /><span><strong>Responsable / referente</strong><small>{espacio.responsable || "Sin dato"}</small></span></div>
          <div><Clock3 size={17} /><span><strong>Horarios</strong><small>{espacio.horarios || "Sin dato"}</small></span></div>
          <div><Contact size={17} /><span><strong>Contacto institucional</strong><small>{espacio.contacto || "Sin dato"}</small></span></div>
        </div>

        <div className="direct-notes">
          <strong>Observaciones de gestión</strong>
          <p>{espacio.notasGestion || "Sin observaciones cargadas."}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel direct-venue-panel">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Ficha del espacio</span>
          <h2>{areaName}</h2>
          <p className="direct-venue-help">
            Este espacio es la dependencia en sí misma. No necesitás crear otro espacio adentro.
          </p>
        </div>
        <Building2 size={23} />
      </div>

      <form action={action} className="direct-venue-form">
        <input type="hidden" name="space_id" value={espacio.id} />
        <input type="hidden" name="area_id" value={areaId} />
        <input type="hidden" name="slug" value={slug} />

        <label>
          <span>Nombre del espacio</span>
          <input name="name" defaultValue={espacio.nombre} required />
        </label>

        <label>
          <span>Tipo</span>
          <input
            name="space_type"
            defaultValue={espacio.tipo}
            placeholder="Centro cultural, teatro…"
          />
        </label>

        <label>
          <span>Localidad</span>
          <input
            name="locality"
            defaultValue={espacio.localidad}
            placeholder="Olavarría, Hinojo, Sierras Bayas…"
          />
        </label>

        <label>
          <span>Dirección</span>
          <input
            name="address"
            defaultValue={espacio.direccion}
            placeholder="Domicilio institucional"
          />
        </label>

        <label>
          <span>Responsable / referente</span>
          <input
            name="responsible_name"
            defaultValue={espacio.responsable}
            placeholder="Nombre y apellido"
          />
        </label>

        <label>
          <span>Estado operativo</span>
          <select
            name="operational_status"
            defaultValue={espacio.estadoOperativo || "a_confirmar"}
          >
            <option value="activo">Activo</option>
            <option value="cerrado_temporalmente">Cerrado temporalmente</option>
            <option value="en_refaccion">En refacción</option>
            <option value="a_confirmar">A confirmar</option>
          </select>
        </label>

        <label>
          <span>Horarios</span>
          <input
            name="opening_hours"
            defaultValue={espacio.horarios}
            placeholder="Días y horarios"
          />
        </label>

        <label>
          <span>Contacto institucional</span>
          <input
            name="public_contact"
            defaultValue={espacio.contacto}
            placeholder="Teléfono, correo o canal institucional"
          />
        </label>

        <label className="wide">
          <span>Observaciones de gestión</span>
          <textarea
            name="management_notes"
            rows={4}
            defaultValue={espacio.notasGestion}
            placeholder="Necesidades, funcionamiento, cuestiones edilicias u observaciones."
          />
        </label>

        <div className="direct-venue-actions wide">
          {estado.mensaje ? (
            <span className={estado.ok ? "form-success" : "form-error"}>
              {estado.ok ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
              {estado.mensaje}
            </span>
          ) : null}

          <button className="button primary" type="submit" disabled={pendiente}>
            <Save size={16} />
            {pendiente ? "Guardando…" : "Guardar ficha del espacio"}
          </button>
        </div>
      </form>
    </section>
  );
}