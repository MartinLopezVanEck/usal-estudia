import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TIPOS_MATERIAL, type TipoMaterial } from "@/lib/constants";
import { Migas } from "@/components/migas";
import { COLUMNAS_ARCHIVO, ListaArchivos, type ArchivoVisible } from "@/components/lista-archivos";

export default async function MateriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ carrera?: string; profesor?: string; tipo?: string }>;
}) {
  const { slug } = await params;
  const { carrera: carreraSlug, profesor, tipo } = await searchParams;
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
      .eq("estado", "aprobado")
      .order("tipo")
      .order("anio_cursada", { ascending: false, nullsFirst: false })
      .order("titulo"),
  ]);

  const archivos = (archivosData ?? []) as ArchivoVisible[];
  const profesores = (catedras ?? [])
    .map((c) => c.profesores as unknown as { id: string; nombre: string })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const conteo = (profId: string | null) => archivos.filter((a) => a.profesor_id === profId).length;
  const sinProfesor = conteo(null);

  const filtrados = archivos.filter(
    (a) =>
      (!profesor || (profesor === "general" ? a.profesor_id === null : a.profesor_id === profesor)) &&
      (!tipo || a.tipo === tipo),
  );
  const tiposPresentes = [...new Set(archivos.map((a) => a.tipo))];

  // Ruta de migas: si venimos de una carrera la usamos, si no la primera del plan.
  const planes = (materia.plan_materias ?? []) as unknown as {
    anio: number;
    carreras: { nombre: string; slug: string; estado: string } | null;
  }[];
  const plan = planes.find((p) => p.carreras?.slug === carreraSlug) ?? planes.find((p) => p.carreras?.estado === "aprobado");

  const href = (cambios: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const valores = { carrera: carreraSlug, profesor, tipo, ...cambios };
    for (const [k, v] of Object.entries(valores)) if (v) q.set(k, v);
    const s = q.toString();
    return `/materias/${slug}${s ? `?${s}` : ""}`;
  };

  const pestana = (activo: boolean) =>
    `flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
      activo ? "bg-acento/10 font-medium text-acento" : "hover:bg-borde/50"
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
        <h1 className="text-2xl font-semibold">{materia.nombre}</h1>
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
          {tiposPresentes.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              <Link
                href={href({ tipo: undefined })}
                className={`rounded-full border px-3 py-1 text-xs ${!tipo ? "border-acento text-acento" : "border-borde"}`}
              >
                Todos
              </Link>
              {tiposPresentes.map((t) => (
                <Link
                  key={t}
                  href={href({ tipo: t })}
                  className={`rounded-full border px-3 py-1 text-xs ${tipo === t ? "border-acento text-acento" : "border-borde"}`}
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
