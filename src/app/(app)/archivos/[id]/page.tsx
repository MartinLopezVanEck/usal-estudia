import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerPerfil } from "@/lib/auth";
import { TIPOS_MATERIAL, formatearTamano, tipoVistaPrevia } from "@/lib/constants";
import { Migas } from "@/components/migas";
import { COLUMNAS_ARCHIVO, EstadoBadge, type ArchivoVisible } from "@/components/lista-archivos";
import { AccionesRevision } from "../../admin/acciones-revision";

export default async function ArchivoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const perfil = await obtenerPerfil();

  const { data } = await supabase
    .from("archivos_visibles")
    .select(COLUMNAS_ARCHIVO)
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const a = data as ArchivoVisible;

  const vista = tipoVistaPrevia(a.nombre_original);
  const urlVer = `/api/archivos/${a.id}?ver=1`;
  const esAdmin = perfil?.rol === "admin";

  return (
    <div>
      <Migas
        items={[
          { label: a.materia_nombre, href: `/materias/${a.materia_slug}` },
          ...(a.profesor_id
            ? [{ label: a.profesor_nombre!, href: `/materias/${a.materia_slug}?profesor=${a.profesor_id}` }]
            : []),
          { label: a.titulo },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{a.titulo}</h1>
            {a.estado !== "aprobado" && <EstadoBadge estado={a.estado} />}
          </div>
          <p className="mt-1 text-sm text-tenue">
            {[
              TIPOS_MATERIAL[a.tipo],
              a.materia_nombre,
              a.profesor_nombre ?? "General",
              a.anio_cursada,
              formatearTamano(a.tamano),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-1 text-sm text-tenue">
            Subido {a.autor_nombre ? `por ${a.autor_nombre}` : "de forma anónima"}
            {a.anonimo && a.autor_nombre && " (anónimo para los alumnos)"}
            {esAdmin && a.autor_email && ` · ${a.autor_email}`}
            {" · "}
            {new Date(a.created_at).toLocaleDateString("es-AR")}
          </p>
          {a.descripcion && <p className="mt-3 max-w-2xl whitespace-pre-line">{a.descripcion}</p>}
          {a.estado === "rechazado" && a.motivo_rechazo && (
            <p className="mt-3 text-sm text-peligro">Motivo del rechazo: {a.motivo_rechazo}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {vista && (
            <a href={urlVer} target="_blank" className="btn-secundario">
              Abrir en pestaña nueva
            </a>
          )}
          <a href={`/api/archivos/${a.id}`} className="btn-primario">
            Descargar
          </a>
        </div>
      </div>

      {esAdmin && (
        <div className="tarjeta mt-4 flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-medium">Admin:</span>
          <AccionesRevision id={a.id} estado={a.estado} />
          <Link href={`/admin/archivos/${a.id}`} className="btn-secundario">
            Editar datos
          </Link>
        </div>
      )}

      <div className="mt-6">
        {vista === "pdf" && (
          <iframe src={urlVer} title={a.titulo} className="tarjeta h-[80vh] w-full" />
        )}
        {vista === "imagen" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlVer} alt={a.titulo} className="tarjeta mx-auto max-h-[80vh] max-w-full" />
        )}
        {vista === "texto" && (
          <iframe src={urlVer} title={a.titulo} className="tarjeta h-[70vh] w-full bg-white" />
        )}
        {!vista && (
          <p className="tarjeta p-6 text-center text-sm text-tenue">
            No hay vista previa para <span className="font-mono">{a.nombre_original}</span>.
            Descargalo para verlo.
          </p>
        )}
      </div>
    </div>
  );
}
