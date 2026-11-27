import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CUATRIMESTRES, type Cuatrimestre } from "@/lib/constants";
import { Migas } from "@/components/migas";

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

  const { data: plan } = await supabase
    .from("plan_materias")
    .select("anio, cuatrimestre, materias!inner(id, nombre, slug, estado)")
    .eq("carrera_id", carrera.id)
    .eq("materias.estado", "aprobado");

  const porAnio = new Map<number, Map<Cuatrimestre, { nombre: string; slug: string }[]>>();
  for (const fila of plan ?? []) {
    const materia = fila.materias as unknown as { nombre: string; slug: string };
    const anio = porAnio.get(fila.anio) ?? new Map();
    const lista = anio.get(fila.cuatrimestre) ?? [];
    lista.push(materia);
    anio.set(fila.cuatrimestre, lista);
    porAnio.set(fila.anio, anio);
  }
  const anios = [...porAnio.keys()].sort((a, b) => a - b);

  return (
    <div>
      <Migas items={[{ label: carrera.nombre }]} />
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{carrera.nombre}</h1>

      {anios.length === 0 && (
        <p className="tarjeta mt-6 p-6 text-center text-sm text-tenue">
          Esta carrera todavía no tiene materias cargadas.
        </p>
      )}

      <div className="mt-8 space-y-10">
        {anios.map((anio, i) => (
          <section key={anio} className="escalonado" style={{ "--i": i * 2 } as React.CSSProperties}>
            <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
              {anio}° año
              <span aria-hidden className="h-px flex-1 bg-borde" />
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {ORDEN_CUATRI.filter((c) => porAnio.get(anio)!.has(c)).map((c) => (
                <div key={c} className="tarjeta p-4">
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-acento">
                    {CUATRIMESTRES[c]}
                  </h3>
                  <ul className="space-y-1">
                    {porAnio
                      .get(anio)!
                      .get(c)!
                      .sort((a, b) => a.nombre.localeCompare(b.nombre))
                      .map((m) => (
                        <li key={m.slug}>
                          <Link
                            href={`/materias/${m.slug}?carrera=${slug}`}
                            className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-acento/10 hover:text-acento"
                          >
                            {m.nombre}
                            <span aria-hidden className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
                              →
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
