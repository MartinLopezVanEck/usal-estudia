import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CUATRIMESTRES, type Cuatrimestre } from "@/lib/constants";
import { Migas } from "@/components/migas";
import { MisMaterias } from "@/components/mis-materias";
import { Recientes } from "@/components/recientes";
import { RecordarCarrera } from "@/components/recordar-carrera";
import { FiltroMaterias, type AnioPlan } from "@/components/filtro-materias";

const ORDEN_CUATRI: Cuatrimestre[] = ["anual", "primero", "segundo"];

export default async function CarreraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: carrera } = await supabase
    .from("carreras")
    .select("id, nombre")
    .eq("slug", slug)
    .eq("estado", "aprobado")
    .single();
  if (!carrera) notFound();

  const { data: filas } = await supabase
    .from("plan_materias")
    .select("anio, cuatrimestre, materias!inner(id, nombre, slug, estado)")
    .eq("carrera_id", carrera.id)
    .eq("materias.estado", "aprobado");

  const porAnio = new Map<number, Map<Cuatrimestre, { nombre: string; slug: string }[]>>();
  for (const fila of filas ?? []) {
    const materia = fila.materias as unknown as { nombre: string; slug: string };
    const anio = porAnio.get(fila.anio) ?? new Map();
    const lista = anio.get(fila.cuatrimestre) ?? [];
    lista.push({ nombre: materia.nombre, slug: materia.slug });
    anio.set(fila.cuatrimestre, lista);
    porAnio.set(fila.anio, anio);
  }

  const plan: AnioPlan[] = [...porAnio.keys()]
    .sort((a, b) => a - b)
    .map((anio) => ({
      anio,
      cuatrimestres: ORDEN_CUATRI.filter((c) => porAnio.get(anio)!.has(c)).map((c) => ({
        clave: c,
        etiqueta: CUATRIMESTRES[c],
        materias: porAnio
          .get(anio)!
          .get(c)!
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      })),
    }));

  return (
    <div>
      <RecordarCarrera slug={slug} />
      <Migas items={[{ label: carrera.nombre }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{carrera.nombre}</h1>
        <Link href="/carreras?todas=1" className="text-sm text-tenue transition hover:text-acento">
          Cambiar de carrera
        </Link>
      </div>

      <div className="mt-8 space-y-8 empty:hidden">
        <Suspense>
          <MisMaterias />
        </Suspense>
        <Recientes />
      </div>

      {plan.length === 0 ? (
        <p className="tarjeta mt-6 p-6 text-center text-sm text-tenue">
          Esta carrera todavía no tiene materias cargadas.
        </p>
      ) : (
        <FiltroMaterias plan={plan} carrera={slug} />
      )}
    </div>
  );
}
