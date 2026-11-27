import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/** Materias fijadas por el alumno. No muestra nada si no tiene ninguna (o si falta la migración 0005). */
export async function MisMaterias() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materias_fijadas")
    .select("materias(nombre, slug, estado)")
    .order("created_at");

  const materias = (data ?? [])
    .map((f) => f.materias as unknown as { nombre: string; slug: string; estado: string } | null)
    .filter((m): m is { nombre: string; slug: string; estado: string } => m?.estado === "aprobado");
  if (materias.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-tenue">Mis materias</h2>
      <ul className="flex flex-wrap gap-2">
        {materias.map((m, i) => (
          <li key={m.slug} className="escalonado" style={{ "--i": i } as React.CSSProperties}>
            <Link
              href={`/materias/${m.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-borde bg-superficie px-4 py-2 text-sm font-medium transition hover:border-acento hover:text-acento"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-acento" fill="currentColor" aria-hidden>
                <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
              </svg>
              {m.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
