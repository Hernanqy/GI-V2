import { Archive } from "lucide-react";
import { EmptyModule } from "@/components/empty-module";
export default function Page(){return <EmptyModule eyebrow="Información institucional" title="Base documental" description="Documentos con fuente, vigencia, responsable y estado de validación." icon={Archive} items={["Vigente","Pendiente de revisión","Histórico","Referencia anual"]}/>}
