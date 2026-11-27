import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerPerfil } from "@/lib/auth";
import { COOKIE_CARRERA, TIPOS_MATERIAL, extension, formatearTamano, tipoVistaPrevia } from "@/lib/constants";
import { ORDENES, consulta, filtrarYOrdenar, leerFiltros, mapaVotos, type FiltrosMateria } from "@/lib/archivos-materia";
import { Migas } from "@/components/migas";
import { RegistrarVisita } from "@/components/recientes";
import { COLUMNAS_ARCHIVO, EstadoBadge, type ArchivoVisible } from "@/components/lista-archivos";
import { AtajosVisor } from "@/components/visor/atajos";
import { BotonUtil, CopiarLink, Reportar } from "@/components/visor/acciones-archivo";
import { CentrarActual } from "@/components/visor/centrar-actual";
import { VisorPdf } from "@/components/visor/visor-pdf";
import { AccionesRevision } from "../../admin/acciones-revision";

type Plan = { anio: number; carreras: { nombre: string; slug: string; estado: string } | null };

const Chevron = ({ izquierda = false }: { izquierda?: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={izquierda ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
  </svg>
);

function BotonFlecha({ href, izquierda, etiqueta }: { href?: string; izquierda?: boolean; etiqueta: string }) {
  const clase = "grid h-9 w-9 place-items-center rounded-full border border-borde bg-superficie transition";
  if (!href) {
    return (
      <span aria-hidden className={`${clase} opacity-40`}>
        <Chevron izquierda={izquierda} />
      </span>
    );
  }
  return (
    <Link href={href} aria-label={etiqueta} title={`${etiqueta} (${izquierda ? "←" : "→"})`} className={`${clase} hover:border-acento hover:text-acento`}>
      <Chevron izquierda={izquierda} />
    </Link>
  );
}

export default async function ArchivoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const filtros = leerFiltros(await searchParams);
  const supabase = await createClient();
  const perfil = await obtenerPerfil();

  const { data } = await supabase.from("archivos_visibles").select(COLUMNAS_ARCHIVO).eq("id", id).maybeSingle();
  if (!data) notFound();
  const a = data as ArchivoVisible;

  const [{ data: hermanosData }, { data: votosData }, { data: miVoto }, { data: materia }, almacen] = await Promise.all([
    supabase.from("archivos_visibles").select(COLUMNAS_ARCHIVO).eq("materia_id", a.materia_id).eq("estado", "aprobado"),
    supabase.from("archivo_votos_conteo").select("archivo_id, votos").eq("materia_id", a.materia_id),
    supabase.from("archivo_votos").select("archivo_id").eq("archivo_id", a.id).maybeSingle(),
    supabase
      .from("materias")
      .select("plan_materias(anio, carreras(nombre, slug, estado))")
      .eq("id", a.materia_id)
      .maybeSingle(),
    cookies(),
  ]);
  const todos = (hermanosData ?? []) as ArchivoVisible[];
  const votos = mapaVotos(votosData);

  // La lista que recorren las flechas: la misma que estabas viendo en la materia.
  // Si este archivo no entra en esos filtros (ej. llegaste desde el buscador), se usan todos.
  let filtrosLista: FiltrosMateria = filtros;
  let lista = filtrarYOrdenar(todos, filtros, votos);
  if (!lista.some((x) => x.id === a.id)) {
    filtrosLista = { carrera: filtros.carrera, orden: filtros.orden };
    lista = filtrarYOrdenar(todos, filtrosLista, votos);
  }
  const pos = lista.findIndex((x) => x.id === a.id);
  const sufijo = consulta(filtrosLista);
  const previo = pos > 0 ? lista[pos - 1] : undefined;
  const proximo = pos >= 0 ? lista[pos + 1] : undefined;
  const hrefArchivo = (x: ArchivoVisible) => `/archivos/${x.id}${sufijo}`;

  // Migas: la carrera desde la que venís, si no la última que abriste, si no la primera del plan.
  const planes = ((materia?.plan_materias ?? []) as unknown as Plan[]).filter((p) => p.carreras?.estado === "aprobado");
  const carreraGuardada = almacen.get(COOKIE_CARRERA)?.value;
  const plan =
    planes.find((p) => p.carreras?.slug === filtros.carrera) ??
    planes.find((p) => p.carreras?.slug === carreraGuardada) ??
    planes[0];
  const volver = `/materias/${a.materia_slug}${consulta({ ...filtrosLista, carrera: filtrosLista.carrera ?? plan?.carreras?.slug })}`;

  // Relacionados: mismo tipo o misma cátedra, los más útiles primero.
  const relacionados = todos
    .filter((x) => x.id !== a.id && (x.tipo === a.tipo || (a.profesor_id !== null && x.profesor_id === a.profesor_id)))
    .sort((x, y) => ORDENES.utiles.comparar(x, y, votos))
    .slice(0, 4);

  const vista = tipoVistaPrevia(a.nombre_original);
  const urlVer = `/api/archivos/${a.id}?ver=1`;
  const esAdmin = perfil?.rol === "admin";

  return (
    <div>
      <RegistrarVisita
        href={`/archivos/${a.id}`}
        titulo={a.titulo}
        detalle={`${TIPOS_MATERIAL[a.tipo]} · ${a.materia_nombre}`}
        tipo="archivo"
      />
      <AtajosVisor anterior={previo && hrefArchivo(previo)} siguiente={proximo && hrefArchivo(proximo)} />

      <Migas
        items={[
          ...(plan?.carreras
            ? [
                { label: plan.carreras.nombre, href: `/carreras/${plan.carreras.slug}` },
                { label: `${plan.anio}° año`, href: `/carreras/${plan.carreras.slug}#anio-${plan.anio}` },
              ]
            : []),
          { label: a.materia_nombre, href: volver },
          { label: a.titulo },
        ]}
      />

      {/* Barra de navegación del visor */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href={volver} className="group inline-flex items-center gap-1.5 text-sm font-medium text-tenue transition hover:text-acento">
          <span aria-hidden className="transition group-hover:-translate-x-0.5">←</span>
          Volver a la lista
        </Link>
        {pos >= 0 && lista.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums text-tenue">
              {pos + 1} de {lista.length}
            </span>
            <BotonFlecha href={previo && hrefArchivo(previo)} izquierda etiqueta="Archivo anterior" />
            <BotonFlecha href={proximo && hrefArchivo(proximo)} etiqueta="Archivo siguiente" />
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{a.titulo}</h1>
            {a.estado !== "aprobado" && <EstadoBadge estado={a.estado} />}
          </div>
          <p className="mt-1.5 text-sm text-tenue">
            {[TIPOS_MATERIAL[a.tipo], a.profesor_nombre ?? "General", a.anio_cursada, formatearTamano(a.tamano)]
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

          <div className="mt-5 flex flex-wrap items-start gap-2">
            <a href={`/api/archivos/${a.id}`} className="btn-primario">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
              </svg>
              Descargar
            </a>
            {vista && (
              <a href={urlVer} target="_blank" rel="noopener" className="btn-secundario hidden md:inline-flex">
                Abrir en pestaña nueva
              </a>
            )}
            <CopiarLink id={a.id} />
            {a.estado === "aprobado" && (
              <BotonUtil id={a.id} votos={votos.get(a.id) ?? 0} votado={Boolean(miVoto)} />
            )}
            <div className="ml-auto self-center">
              <Reportar id={a.id} />
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
            {vista === "pdf" && <VisorPdf url={urlVer} titulo={a.titulo} />}
            {vista === "imagen" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlVer} alt={a.titulo} className="tarjeta mx-auto max-h-[80vh] max-w-full" />
            )}
            {vista === "texto" && (
              <iframe src={urlVer} title={a.titulo} className="tarjeta h-[70vh] w-full bg-white" />
            )}
            {!vista && (
              <p className="tarjeta p-6 text-center text-sm text-tenue">
                No hay vista previa para <span className="font-mono">{a.nombre_original}</span>. Descargalo para verlo.
              </p>
            )}
          </div>

          {/* Anterior / siguiente grandes, cómodos para el celular después de leer */}
          {(previo || proximo) && (
            <nav aria-label="Otros archivos de la lista" className="mt-6 grid gap-3 sm:grid-cols-2">
              {previo ? (
                <Link href={hrefArchivo(previo)} className="tarjeta-link p-4">
                  <span className="text-xs text-tenue">← Anterior</span>
                  <span className="mt-0.5 block truncate font-medium">{previo.titulo}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {proximo && (
                <Link href={hrefArchivo(proximo)} className="tarjeta-link p-4 text-right">
                  <span className="text-xs text-tenue">Siguiente →</span>
                  <span className="mt-0.5 block truncate font-medium">{proximo.titulo}</span>
                </Link>
              )}
            </nav>
          )}

          {relacionados.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-bold">Más de {a.materia_nombre}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {relacionados.map((r) => (
                  <li key={r.id}>
                    <Link href={`/archivos/${r.id}`} className="tarjeta-link flex items-center gap-3 p-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-acento/10 font-mono text-[10px] font-semibold uppercase text-acento">
                        {extension(r.nombre_original) || "?"}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{r.titulo}</span>
                        <span className="block truncate text-xs text-tenue">
                          {[TIPOS_MATERIAL[r.tipo], r.profesor_nombre ?? "General", r.anio_cursada].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Lista lateral para saltar entre archivos sin volver (solo en pantallas grandes) */}
        {lista.length > 1 && (
          <aside className="hidden lg:block">
            <div className="tarjeta sticky top-20 overflow-hidden">
              <p className="border-b border-borde px-4 py-3 text-sm font-semibold">
                En esta lista <span className="font-normal text-tenue">({lista.length})</span>
              </p>
              <ul id="lista-lateral" className="relative max-h-[calc(100vh-10rem)] overflow-y-auto py-1.5">
                {lista.map((x) => {
                  const actual = x.id === a.id;
                  return (
                    <li key={x.id}>
                      <Link
                        href={hrefArchivo(x)}
                        aria-current={actual ? "page" : undefined}
                        className={`block border-l-2 px-4 py-2 text-sm transition ${
                          actual ? "border-acento bg-acento/10 font-medium text-acento" : "border-transparent hover:bg-suave"
                        }`}
                      >
                        <span className="block truncate">{x.titulo}</span>
                        <span className="block truncate text-xs text-tenue">
                          {[TIPOS_MATERIAL[x.tipo], x.anio_cursada].filter(Boolean).join(" · ")}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <CentrarActual idLista="lista-lateral" />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
