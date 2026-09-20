import { Archive, DatabaseZap } from "lucide-react";
import { DocumentManager, type DocumentAreaOption } from "@/components/document-manager";
import { obtenerAreas } from "@/lib/areas-data";
import { obtenerDocumentos } from "@/lib/documents-data";
import { obtenerPerfilActual } from "@/lib/session-data";

export default async function DocumentosPage() {
  const [areas, documentos, perfil] = await Promise.all([
    obtenerAreas(),
    obtenerDocumentos(),
    obtenerPerfilActual(),
  ]);

  const esCoordinacion = perfil?.rol === "coordinacion";

  const areasPermitidas = esCoordinacion
    ? areas
    : areas.filter((area) => area.id === perfil?.areaId);

  const opciones: DocumentAreaOption[] = areasPermitidas.map((area) => ({
    id: area.id,
    nombre: area.nombre,
    espacios: area.espacios.map((espacio) => ({
      id: espacio.id,
      nombre: espacio.nombre,
    })),
  }));

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Información institucional</span>
          <h1>Base documental</h1>
          <p>
            Registro unificado de documentos, fuentes, vigencia, responsables y enlaces institucionales.
          </p>
        </div>
        <span className="heading-icon"><Archive size={26} /></span>
      </section>

      <section className="notice document-notice">
        <DatabaseZap size={20} />
        <div>
          <strong>Fuente única y trazable</strong>
          <span>
            Cada documento puede quedar vinculado a una dependencia, un espacio y su archivo original en Drive.
          </span>
        </div>
      </section>

      <DocumentManager
        documentos={documentos}
        areas={opciones}
        editable={Boolean(perfil)}
        canManageGeneral={esCoordinacion}
      />
    </div>
  );
}