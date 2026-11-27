import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TIPOS_MATERIAL, type TipoMaterial } from "@/lib/constants";
import { Migas } from "@/components/migas";
import { COLUMNAS_ARCHIVO, ListaArchivos, type ArchivoVisible } from "@/components/lista-archivos";

const ORDEN_TIPOS = Object.keys(TIPOS_MATERIAL);

/** Los archivos sin año van siempre al final. */
function porAnio(a: ArchivoVisible, b: ArchivoVisible, sentido: 1 | -1) {
  if (a.anio_cursada === b.anio_cursada) return 0;
  if (a.anio_cursada === null) return 1;
  if (b.anio_cursada === null) return -1;
  return (a.anio_cursada - b.anio_cursada) * sentido;
}

const ORDENES = {
  recientes: {
    etiqueta: "Más recientes",
    comparar: (a: ArchivoVisible, b: ArchivoVisible) =>
      porAnio(a, b, -1) || b.created_at.localeCompare(a.created_at),
  },
  antiguos: {
    etiqueta: "Más antiguos",
    comparar: (a: ArchivoVisible, b: ArchivoVisible) =>
      porAnio(a, b, 1) || a.titulo.localeCompare(b.titulo),
  },
  tipo: {
    etiqueta: "Por tipo",
    comparar: (a: ArchivoVisible, b: ArchivoVisible) =>
      ORDEN_TIPOS.indexOf(a.tipo) - ORDEN_TIPOS.indexOf(b.tipo) ||
      porAnio(a, b, -1) ||
      a.titulo.localeCompare(b.titulo),
  },
};
type Orden = keyof typeof ORDENES;

export default async function MateriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ carrera?: string; profesor?: string; tipo?: string; orden?: string }>;
}) {
  const { slug } = await params;
  const { carrera: carreraSlug, profesor, tipo, orden: ordenParam } = await searchParams;
  const orden: Orden = ordenParam && ordenParam in ORDENES ? (ordenParam as Orden) : "recientes";
  const supabase = await createClient();

  const { data: materia } = await supabase
    .from("materias")
    .select("id, nombre, plan_materias(anio, carreras(nombre, slug, estado))")
    .eq("slug", slug)
    .eq("estado", "aprobado")
    .single();
  if (!materia) notFound();

  const [{ data: catedras }, { data: archivosData }] = await Promise.all([
    supabase
      .from("catedras")
      .select("profesores!inner(id, nombre, estado)")
      .eq("materia_id", materia.id)
      .eq("profesores.estado", "aprobado"),
    supabase
      .from("archivos_visibles")
      .select(COLUMNAS_ARCHIVO)
      .eq("materia_id", materia.id)
      .eq("estado", "aprobado"),
  ]);

  const archivos = (archivosData ?? []) as ArchivoVisible[];
  const profesores = (catedras ?? [])
    .map((c) => c.profesores as unknown as { id: string; nombre: string })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const conteo = (profId: string | null) => archivos.filter((a) => a.profesor_id === profId).length;
  const sinProfesor = conteo(null);

  const filtrados = archivos
    .filter(
      (a) =>
        (!profesor || (profesor === "general" ? a.profesor_id === null : a.profesor_id === profesor)) &&
        (!tipo || a.tipo === tipo),
    )
    .sort(ORDENES[orden].comparar);
  const tiposPresentes = [...new Set(archivos.map((a) => a.tipo))];

  // Ruta de migas: si venimos de una carrera la usamos, si no la primera del plan.
  const planes = (materia.plan_materias ?? []) as unknown as {
    anio: number;
    carreras: { nombre: string; slug: string; estado: string } | null;
  }[];
  const plan = planes.find((p) => p.carreras?.slug === carreraSlug) ?? planes.find((p) => p.carreras?.estado === "aprobado");

  const href = (cambios: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const valores = { carrera: carreraSlug, profesor, tipo, orden: ordenParam, ...cambios };
    for (const [k, v] of Object.entries(valores)) if (v) q.set(k, v);
    const s = q.toString();
    return `/materias/${slug}${s ? `?${s}` : ""}`;
  };

  const pestana = (activo: boolean) =>
    `flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
      activo ? "bg-acento/10 font-semibold text-acento" : "text-tenue hover:bg-suave hover:text-texto"
    }`;

  return (
    <div>
      <Migas
        items={[
          ...(plan?.carreras
            ? [
                { label: plan.carreras.nombre, href: `/carreras/${plan.carreras.slug}` },
                { label: `${plan.anio}° Año`, href: `/carreras/${plan.carreras.slug}` },
              ]
            : []),
          { label: materia.nombre },
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold">{materia.nombre}</h1>
        <Link href={`/subir?materia=${materia.id}`} className="btn-secundario">
          Subir material de esta materia
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <aside>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-tenue">Cátedras</h2>
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            <Link href={href({ profesor: undefined })} className={pestana(!profesor)}>
              Todas <span className="text-xs text-tenue">{archivos.length}</span>
            </Link>
            {profesores.map((p) => (
              <Link key={p.id} href={href({ profesor: p.id })} className={pestana(profesor === p.id)}>
                <span className="whitespace-nowrap">{p.nombre}</span>
                <span className="text-xs text-tenue">{conteo(p.id)}</span>
              </Link>
            ))}
            {sinProfesor > 0 && (
              <Link href={href({ profesor: "general" })} className={pestana(profesor === "general")}>
                General <span className="text-xs text-tenue">{sinProfesor}</span>
              </Link>
            )}
          </nav>
        </aside>

        <section>
          <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
            <span className="mr-1 text-tenue">Ordenar:</span>
            {(Object.entries(ORDENES) as [Orden, (typeof ORDENES)[Orden]][]).map(([clave, { etiqueta }]) => (
              <Link
                key={clave}
                href={href({ orden: clave === "recientes" ? undefined : clave })}
                className={`rounded-lg px-2.5 py-1 transition ${orden === clave ? "bg-acento/10 font-semibold text-acento" : "text-tenue hover:bg-suave hover:text-texto"}`}
              >
                {etiqueta}
              </Link>
            ))}
          </div>
          {tiposPresentes.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              <Link
                href={href({ tipo: undefined })}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${!tipo ? "border-acento bg-acento text-acento-texto" : "border-borde bg-superficie hover:border-acento/50"}`}
              >
                Todos
              </Link>
              {tiposPresentes.map((t) => (
                <Link
                  key={t}
                  href={href({ tipo: t })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${tipo === t ? "border-acento bg-acento text-acento-texto" : "border-borde bg-superficie hover:border-acento/50"}`}
                >
                  {TIPOS_MATERIAL[t as TipoMaterial]}
                </Link>
              ))}
            </div>
          )}
          <ListaArchivos
            archivos={filtrados}
            mostrarMateria={false}
            vacio="No hay material para este filtro. ¡Podés ser el primero en subir algo!"
          />
        </section>
      </div>
    </div>
  );
}
