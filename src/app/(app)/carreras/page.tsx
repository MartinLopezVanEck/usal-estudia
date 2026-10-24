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
      <h1 className="text-2xl font-semibold">Carreras</h1>
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
                className="tarjeta block p-5 transition hover:border-acento"
              >
                <span className="font-medium">{c.nombre}</span>
                <span className="mt-1 block text-sm text-tenue">
                  {c.plan_materias[0]?.count ?? 0} materias
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
