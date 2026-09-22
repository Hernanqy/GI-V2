import {
  MapPin,
  Pencil,
  Plus,
  Save,
} from "lucide-react";

import {
  crearSede,
  guardarFichaOperativa,
  guardarSede,
} from "@/app/(plataforma)/areas/operational-actions";

import type {
  EspacioCultural,
} from "@/lib/areas-data";


export type OperationalLocation = {
  id: string;
  space_id: string;
  venue_name: string;
  locality: string | null;
  address: string | null;
  schedule_text: string | null;
  location_validated: boolean;
  is_primary: boolean;
};


type Props = {
  areaId: string;
  areaSlug: string;
  espacio: EspacioCultural;
  esEducacion: boolean;
  metricMonth: string;
  metricValue:
    number | null;
  sedes: OperationalLocation[];
};


export function OperationalCardEditor({
  areaId,
  areaSlug,
  espacio,
  esEducacion,
  metricMonth,
  metricValue,
  sedes,
}: Props) {

  return (
    <div className="operational-card-edit-zone">

      <details className="operational-card-editor">

        <summary>
          <Pencil size={14} />

          Editar información
        </summary>


        <form
          action={
            guardarFichaOperativa
          }
          className="operational-edit-form"
        >

          <input
            type="hidden"
            name="space_id"
            value={espacio.id}
          />

          <input
            type="hidden"
            name="area_id"
            value={areaId}
          />

          <input
            type="hidden"
            name="slug"
            value={areaSlug}
          />

          <input
            type="hidden"
            name="metric_month"
            value={metricMonth}
          />

          <input
            type="hidden"
            name="metric_kind"
            value={
              esEducacion
                ? "participants"
                : "visitors"
            }
          />


          <div className="operational-edit-grid">

            <label className="wide">
              <span>
                Nombre
              </span>

              <input
                name="name"
                defaultValue={
                  espacio.nombre
                }
                required
              />
            </label>


            <label>
              <span>
                Estado operativo
              </span>

              <select
                name="operational_status"
                defaultValue={
                  espacio.estadoOperativo ||
                  "a_confirmar"
                }
              >
                <option value="activo">
                  Activo
                </option>

                <option value="actividad_parcial">
                  Actividad parcial
                </option>

                <option value="cerrado_temporalmente">
                  Cerrado temporalmente
                </option>

                <option value="sin_referente">
                  Sin referente
                </option>

                <option value="a_confirmar">
                  A confirmar
                </option>
              </select>
            </label>


            <label>
              <span>
                Responsable / referente
              </span>

              <input
                name="responsible_name"
                defaultValue={
                  espacio.responsable
                }
                placeholder="Nombre y apellido"
              />
            </label>


            <label>
              <span>
                Contacto
              </span>

              <input
                name="public_contact"
                defaultValue={
                  espacio.contacto
                }
                placeholder="Teléfono, correo o canal"
              />
            </label>


            {
              esEducacion
                ? (
                  <>
                    <input
                      type="hidden"
                      name="space_type"
                      value={espacio.tipo}
                    />

                    <input
                      type="hidden"
                      name="locality"
                      value={espacio.localidad}
                    />

                    <input
                      type="hidden"
                      name="address"
                      value={espacio.direccion}
                    />

                    <input
                      type="hidden"
                      name="opening_hours"
                      value={espacio.horarios}
                    />
                  </>
                )
                : (
                  <>
                    <label>
                      <span>
                        Tipo de espacio
                      </span>

                      <input
                        name="space_type"
                        defaultValue={
                          espacio.tipo
                        }
                        placeholder="Centro cultural, museo..."
                      />
                    </label>


                    <label>
                      <span>
                        Localidad
                      </span>

                      <input
                        name="locality"
                        defaultValue={
                          espacio.localidad
                        }
                      />
                    </label>


                    <label className="wide">
                      <span>
                        Dirección
                      </span>

                      <input
                        name="address"
                        defaultValue={
                          espacio.direccion
                        }
                      />
                    </label>


                    <label className="wide">
                      <span>
                        Horarios
                      </span>

                      <input
                        name="opening_hours"
                        defaultValue={
                          espacio.horarios
                        }
                        placeholder="Días y horarios"
                      />
                    </label>
                  </>
                )
            }


            <label>
              <span>
                {
                  esEducacion
                    ? "Participantes del mes"
                    : "Visitantes del mes"
                }
              </span>

              <input
                name="metric_value"
                type="number"
                min="0"
                step="1"
                defaultValue={
                  metricValue ??
                  ""
                }
                placeholder="Sin carga"
              />
            </label>


            <label className="wide">
              <span>
                Observaciones de gestión
              </span>

              <textarea
                name="management_notes"
                rows={3}
                defaultValue={
                  espacio.notasGestion
                }
                placeholder="Observaciones internas"
              />
            </label>

          </div>


          <div className="operational-edit-help">
            La agenda próxima se modifica desde las cards de Agenda.
            Si cambiás una dirección, la ubicación del mapa quedará pendiente de validar.
          </div>


          <button
            type="submit"
            className="button primary operational-save-button"
          >
            <Save size={15} />

            Guardar ficha
          </button>

        </form>

      </details>


      {
        esEducacion
          ? (
            <details className="operational-card-editor venue-editor-section">

              <summary>
                <MapPin size={14} />

                Editar sedes y horarios
              </summary>


              <div className="venue-edit-list">

                {
                  sedes.map(
                    (sede) => (

                      <form
                        action={
                          guardarSede
                        }
                        className="venue-edit-form"
                        key={sede.id}
                      >

                        <input
                          type="hidden"
                          name="location_id"
                          value={sede.id}
                        />

                        <input
                          type="hidden"
                          name="space_id"
                          value={espacio.id}
                        />

                        <input
                          type="hidden"
                          name="slug"
                          value={areaSlug}
                        />


                        <div className="venue-editor-title">
                          <strong>
                            {sede.venue_name}
                          </strong>

                          <span>
                            {
                              sede.location_validated
                                ? "Ubicación validada"
                                : "Pendiente de validar"
                            }
                          </span>
                        </div>


                        <div className="operational-edit-grid">

                          <label className="wide">
                            <span>
                              Nombre de la sede
                            </span>

                            <input
                              name="venue_name"
                              defaultValue={
                                sede.venue_name
                              }
                              required
                            />
                          </label>


                          <label>
                            <span>
                              Localidad
                            </span>

                            <input
                              name="locality"
                              defaultValue={
                                sede.locality ??
                                ""
                              }
                            />
                          </label>


                          <label>
                            <span>
                              Dirección
                            </span>

                            <input
                              name="address"
                              defaultValue={
                                sede.address ??
                                ""
                              }
                            />
                          </label>


                          <label className="wide">
                            <span>
                              Días y horarios
                            </span>

                            <input
                              name="schedule_text"
                              defaultValue={
                                sede.schedule_text ??
                                ""
                              }
                              placeholder="Ej. lunes y miércoles 18 a 20"
                            />
                          </label>


                          <label className="operational-check">
                            <input
                              type="checkbox"
                              name="is_primary"
                              defaultChecked={
                                sede.is_primary
                              }
                            />

                            <span>
                              Sede principal
                            </span>
                          </label>

                        </div>


                        <button
                          type="submit"
                          className="button secondary venue-save-button"
                        >
                          <Save size={14} />

                          Guardar sede
                        </button>

                      </form>
                    ),
                  )
                }


                <details className="new-venue-editor">

                  <summary>
                    <Plus size={14} />

                    Agregar nueva sede
                  </summary>


                  <form
                    action={
                      crearSede
                    }
                    className="venue-edit-form new"
                  >

                    <input
                      type="hidden"
                      name="space_id"
                      value={espacio.id}
                    />

                    <input
                      type="hidden"
                      name="slug"
                      value={areaSlug}
                    />


                    <div className="operational-edit-grid">

                      <label className="wide">
                        <span>
                          Nombre de la sede
                        </span>

                        <input
                          name="venue_name"
                          required
                          placeholder="Nombre del espacio o sede"
                        />
                      </label>


                      <label>
                        <span>
                          Localidad
                        </span>

                        <input
                          name="locality"
                          defaultValue="Olavarría"
                        />
                      </label>


                      <label>
                        <span>
                          Dirección
                        </span>

                        <input
                          name="address"
                        />
                      </label>


                      <label className="wide">
                        <span>
                          Días y horarios
                        </span>

                        <input
                          name="schedule_text"
                        />
                      </label>


                      <label className="operational-check">
                        <input
                          type="checkbox"
                          name="is_primary"
                        />

                        <span>
                          Sede principal
                        </span>
                      </label>

                    </div>


                    <button
                      type="submit"
                      className="button primary venue-save-button"
                    >
                      <Plus size={14} />

                      Crear sede
                    </button>

                  </form>

                </details>

              </div>

            </details>
          )
          : null
      }

    </div>
  );
}