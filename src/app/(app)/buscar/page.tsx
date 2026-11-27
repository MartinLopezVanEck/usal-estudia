import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { COLUMNAS_ARCHIVO, ListaArchivos, type ArchivoVisible } from "@/components/lista-archivos";

export const metadata: Metadata = { title: "Buscar" };

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[%_,()]/g, " ");
}

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const palabras = normalizar(q).split(/\s+/).filter(Boolean).slice(0, 8);
  const supabase = await createClient();

  let archivos: ArchivoVisible[] = [];
  let materias: { nombre: string; slug: string }[] = [];

  if (palabras.length) {
    // Cada palabra tiene que aparecer en algún lado (título, materia, profesor, descripción).
    let consulta = supabase.from("archivos_visibles").select(COLUMNAS_ARCHIVO).eq("estado", "aprobado");
    for (const p of palabras) consulta = consulta.ilike("busqueda", `%${p}%`);

    const [resArchivos, resMaterias] = await Promise.all([
      consulta.order("created_at", { ascending: false }).limit(100),
      supabase.from("materias").select("nombre, slug").eq("estado", "aprobado"),
    ]);
    archivos = (resArchivos.data ?? []) as ArchivoVisible[];
    materias = (resMaterias.data ?? []).filter((m) => {
      const nombre = normalizar(m.nombre);
      return palabras.every((p) => nombre.includes(p));
    });
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        {q ? <>Resultados para «{q}»</> : "Buscar"}
      </h1>

      {materias.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-tenue">Materias</h2>
          <div className="flex flex-wrap gap-2">
            {materias.map((m) => (
              <Link key={m.slug} href={`/materias/${m.slug}`} className="btn-secundario">
                {m.nombre}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-tenue">Archivos</h2>
        <ListaArchivos
          archivos={archivos}
          mostrarMateria
          vacio={q ? "No encontramos archivos con esa búsqueda." : "Escribí algo en el buscador."}
        />
      </section>
    </div>
  );
}
