import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Datos públicos que cambian poco: se guardan en caché unos minutos para no
 * consultar a Supabase en cada visita o cada tecla del buscador.
 * Cuando un admin cambia el catálogo se invalida la etiqueta "catalogo".
 */
export const TAG_CATALOGO = "catalogo";

/** Materias aprobadas (nombre y slug), para las sugerencias del buscador. */
export const materiasAprobadas = unstable_cache(
  async () => {
    const { data } = await createAdminClient()
      .from("materias")
      .select("nombre, slug")
      .eq("estado", "aprobado")
      .order("nombre");
    return data ?? [];
  },
  ["materias-aprobadas"],
  { revalidate: 300, tags: [TAG_CATALOGO] },
);

/** Totales de la portada. */
export const conteosPortada = unstable_cache(
  async () => {
    const db = createAdminClient();
    const [archivos, materias, profesores] = await Promise.all(
      (["archivos", "materias", "profesores"] as const).map((t) =>
        db.from(t).select("id", { count: "exact", head: true }).eq("estado", "aprobado"),
      ),
    );
    return {
      archivos: archivos.count ?? 0,
      materias: materias.count ?? 0,
      profesores: profesores.count ?? 0,
    };
  },
  ["conteos-portada"],
  { revalidate: 600, tags: [TAG_CATALOGO] },
);
