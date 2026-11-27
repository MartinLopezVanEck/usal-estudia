import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_CARRERA, TIPOS_MATERIAL, type TipoMaterial } from "@/lib/constants";
import { ORDENES, consulta, filtrarYOrdenar, leerFiltros, ordenValido, type Orden } from "@/lib/archivos-materia";
import { Migas } from "@/components/migas";
import { BotonFijar } from "@/components/boton-fijar";
import { RegistrarVisita } from "@/components/recientes";
import { COLUMNAS_ARCHIVO, ListaArchivos, type ArchivoVisible } from "@/components/lista-archivos";

type Plan = { anio: number; carreras: { nombre: string; slug: string; estado: string } | null };

export default async function MateriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const filtros = leerFiltros(await searchParams);
  const orden = ordenValido(filtros.orden);
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
    supabase.from("archivos_visibles").select(COLUMNAS_ARCHIVO).eq("materia_id", materia.id).eq("estado", "aprobado"),
  ]);

  const archivos = (archivosData ?? []) as ArchivoVisible[];
  const profesores = (catedras ?? [])
    .map((c) => c.profesores as unknown as { id: string; nombre: string })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const conteo = (profId: string | null) => archivos.filter((a) => a.profesor_id === profId).length;
  const sinProfesor = conteo(null);

  const filtrados = filtrarYOrdenar(archivos, filtros);
  const tiposPresentes = [...new Set(archivos.map((a) => a.tipo))];
  const aniosPresentes = [...new Set(archivos.map((a) => a.anio_cursada).filter((a): a is number => a !== null))].sort(
    (a, b) => b - a,
  );

  // Ruta de migas: la carrera desde la que venís, si no la última que abriste, si no la primera del plan.
  const planes = (materia.plan_materias ?? []) as unknown as Plan[];
  const carreraGuardada = (await cookies()).get(COOKIE_CARRERA)?.value;
  const plan =
    planes.find((p) => p.carreras?.slug === filtros.carrera) ??
    planes.find((p) => p.carreras?.slug === carreraGuardada) ??
    planes.find((p) => p.carreras?.estado === "aprobado");
  const conCarrera = { ...filtros, carrera: filtros.carrera ?? plan?.carreras?.slug };

  const href = (cambios: Record<string, string | undefined>) => `/materias/${slug}${consulta(filtros, cambios)}`;
  const hayFiltros = Boolean(filtros.profesor || filtros.tipo || filtros.anio);

  const pestana = (activo: boolean) =>
    `flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
      activo ? "bg-acento/10 font-semibold text-acento" : "text-tenue hover:bg-suave hover:text-texto"
    }`;
  const chip = (activo: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition ${
      activo ? "border-acento bg-acento text-acento-texto" : "border-borde bg-superficie hover:border-acento/50"
    }`;

  return (
    <div>
      <RegistrarVisita
        href={`/materias/${slug}`}
        titulo={materia.nombre}
        detalle={`${archivos.length} archivos`}
        tipo="materia"
      />
      <Migas
        items={[
          ...(plan?.carreras
            ? [
                { label: plan.carreras.nombre, href: `/carreras/${plan.carreras.slug}` },
                { label: `${plan.anio}° año`, href: `/carreras/${plan.carreras.slug}#anio-${plan.anio}` },
              ]
            : []),
          { label: materia.nombre },
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{materia.nombre}</h1>
        <div className="flex flex-wrap items-start gap-2">
          <BotonFijar slug={slug} nombre={materia.nombre} />
          <Link href={`/subir?materia=${materia.id}`} className="btn-secundario">
            Subir material
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <aside>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-tenue">Cátedras</h2>
          <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0">
            <Link href={href({ profesor: undefined })} className={pestana(!filtros.profesor)}>
              Todas <span className="text-xs text-tenue">{archivos.length}</span>
            </Link>
            {profesores.map((p) => (
              <Link key={p.id} href={href({ profesor: p.id })} className={pestana(filtros.profesor === p.id)}>
                <span className="whitespace-nowrap">{p.nombre}</span>
                <span className="text-xs text-tenue">{conteo(p.id)}</span>
              </Link>
            ))}
            {sinProfesor > 0 && (
              <Link href={href({ profesor: "general" })} className={pestana(filtros.profesor === "general")}>
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
            <div className="mb-2 flex flex-wrap gap-2">
              <Link href={href({ tipo: undefined })} className={chip(!filtros.tipo)}>
                Todos los tipos
              </Link>
              {tiposPresentes.map((t) => (
                <Link key={t} href={href({ tipo: t })} className={chip(filtros.tipo === t)}>
                  {TIPOS_MATERIAL[t as TipoMaterial]}
                </Link>
              ))}
            </div>
          )}

          {aniosPresentes.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              <Link href={href({ anio: undefined })} className={chip(!filtros.anio)}>
                Todos los años
              </Link>
              {aniosPresentes.map((a) => (
                <Link key={a} href={href({ anio: String(a) })} className={chip(filtros.anio === String(a))}>
                  {a}
                </Link>
              ))}
            </div>
          )}

          {hayFiltros && (
            <p className="mb-3 text-sm text-tenue">
              {filtrados.length} de {archivos.length} archivos ·{" "}
              <Link
                href={href({ profesor: undefined, tipo: undefined, anio: undefined })}
                className="text-acento hover:underline"
              >
                Quitar filtros
              </Link>
            </p>
          )}

          <ListaArchivos
            archivos={filtrados}
            mostrarMateria={false}
            sufijo={consulta(conCarrera)}
            vacio="No hay material para este filtro. ¡Podés ser el primero en subir algo!"
          />
        </section>
      </div>
    </div>
  );
}
