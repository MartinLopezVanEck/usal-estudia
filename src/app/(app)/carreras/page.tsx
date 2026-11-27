import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function InicioPage() {
  const supabase = await createClient();
  const { data: carreras } = await supabase
    .from("carreras")
    .select("id, nombre, slug, plan_materias(count)")
    .eq("estado", "aprobado")
    .order("nombre");

  return (
    <div>
      <h1 className="text-3xl font-bold">Carreras</h1>
      <p className="mt-1 text-sm text-tenue">
        Elegí tu carrera para ver las materias por año.
      </p>

      {!carreras?.length ? (
        <p className="tarjeta mt-6 p-6 text-center text-sm text-tenue">
          Todavía no hay carreras cargadas.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {carreras.map((c) => (
            <li key={c.id}>
              <Link
                href={`/carreras/${c.slug}`}
                className="tarjeta-link group flex h-full items-center gap-4 p-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-acento/10 text-acento transition group-hover:bg-acento group-hover:text-acento-texto">
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
