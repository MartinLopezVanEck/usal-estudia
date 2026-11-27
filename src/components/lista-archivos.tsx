import Link from "next/link";
import {
  ESTADOS,
  TIPOS_MATERIAL,
  extension,
  formatearTamano,
  type EstadoRevision,
  type TipoMaterial,
} from "@/lib/constants";

export type ArchivoVisible = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoMaterial;
  materia_id: string;
  materia_nombre: string;
  materia_slug: string;
  profesor_id: string | null;
  profesor_nombre: string | null;
  anio_cursada: number | null;
  nombre_original: string;
  tamano: number;
  anonimo: boolean;
  estado: EstadoRevision;
  motivo_rechazo: string | null;
  created_at: string;
  es_mio: boolean;
  autor_nombre: string | null;
  autor_email: string | null;
};

export const COLUMNAS_ARCHIVO =
  "id, titulo, descripcion, tipo, materia_id, materia_nombre, materia_slug, profesor_id, profesor_nombre, anio_cursada, nombre_original, tamano, anonimo, estado, motivo_rechazo, created_at, es_mio, autor_nombre, autor_email";

const COLOR_ESTADO: Record<EstadoRevision, string> = {
  pendiente: "bg-aviso/15 text-aviso",
  aprobado: "bg-exito/15 text-exito",
  rechazado: "bg-peligro/15 text-peligro",
};

export function EstadoBadge({ estado }: { estado: EstadoRevision }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_ESTADO[estado]}`}>
      {ESTADOS[estado]}
    </span>
  );
}

export function ListaArchivos({
  archivos,
  mostrarMateria = false,
  mostrarEstado = false,
  vacio = "Todavía no hay archivos acá.",
  sufijo = "",
}: {
  archivos: ArchivoVisible[];
  mostrarMateria?: boolean;
  mostrarEstado?: boolean;
  vacio?: string;
  /** Filtros de la lista ("?profesor=..."), para que el visor recorra la misma lista. */
  sufijo?: string;
}) {
  if (archivos.length === 0) {
    return <p className="tarjeta p-6 text-center text-sm text-tenue">{vacio}</p>;
  }

  return (
    <ul className="tarjeta divide-y divide-borde overflow-hidden">
      {archivos.map((a, i) => (
        <li key={a.id} className="escalonado" style={{ "--i": i } as React.CSSProperties}>
          <Link href={`/archivos/${a.id}${sufijo}`} className="group flex items-start gap-3.5 p-4 transition hover:bg-suave">
            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-acento/10 font-mono text-[10px] font-semibold uppercase text-acento transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-acento group-hover:text-acento-texto">
              {extension(a.nombre_original) || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium transition group-hover:text-acento">{a.titulo}</span>
                <span className="rounded-full border border-borde px-2 py-0.5 text-xs text-tenue">
                  {TIPOS_MATERIAL[a.tipo]}
                </span>
                {mostrarEstado && <EstadoBadge estado={a.estado} />}
              </div>
              <p className="mt-1 text-xs text-tenue">
                {[
                  mostrarMateria && a.materia_nombre,
                  a.profesor_nombre ?? "General",
                  a.anio_cursada,
                  formatearTamano(a.tamano),
                  a.autor_nombre ? `por ${a.autor_nombre}` : "anónimo",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {mostrarEstado && a.estado === "rechazado" && a.motivo_rechazo && (
                <p className="mt-1 text-xs text-peligro">Motivo: {a.motivo_rechazo}</p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
