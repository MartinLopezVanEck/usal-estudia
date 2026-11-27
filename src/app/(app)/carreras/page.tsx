import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_CARRERA } from "@/lib/constants";
import { MisMaterias } from "@/components/mis-materias";
import { Recientes } from "@/components/recientes";

export default async function InicioPage({ searchParams }: { searchParams: Promise<{ todas?: string }> }) {
  const { todas } = await searchParams;
  const supabase = await createClient();
  const { data: carreras } = await supabase
    .from("carreras")
    .select("id, nombre, slug, plan_materias(count)")
    .eq("estado", "aprobado")
    .order("nombre");

  // Si ya elegiste una carrera antes, "Carreras" te lleva directo ahí.
  const guardada = (await cookies()).get(COOKIE_CARRERA)?.value;
  if (!todas && guardada && carreras?.some((c) => c.slug === guardada)) redirect(`/carreras/${guardada}`);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Carreras</h1>
      <p className="mt-2 text-tenue">Elegí tu carrera para ver las materias por año y cuatrimestre.</p>

      <div className="mt-8 space-y-8 empty:hidden">
        <Suspense>
          <MisMaterias />
        </Suspense>
        <Recientes />
      </div>

      {!carreras?.length ? (
        <p className="tarjeta mt-8 p-6 text-center text-sm text-tenue">
          Todavía no hay carreras cargadas.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {carreras.map((c, i) => (
            <li key={c.id} className="escalonado" style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={`/carreras/${c.slug}`}
                className="tarjeta-link group flex h-full items-center gap-4 p-5"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-acento/10 text-acento transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110 group-hover:bg-acento group-hover:text-acento-texto">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M22 10 12 5 2 10l10 5 10-5z" />
                    <path d="M6 12v5c3 2 9 2 12 0v-5" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{c.nombre}</span>
                  <span className="mt-0.5 block text-sm text-tenue">
                    {c.plan_materias[0]?.count ?? 0} materias
                  </span>
                </span>
                <span aria-hidden className="text-tenue transition group-hover:translate-x-0.5 group-hover:text-acento">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
