import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { coincide, palabras } from "@/lib/busqueda";
import { TIPOS_MATERIAL, type TipoMaterial } from "@/lib/constants";

/** Sugerencias rápidas para el buscador del header (materias y archivos). */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const buscadas = palabras(q, 6);
  if (!buscadas.length) return NextResponse.json({ materias: [], archivos: [] });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let consulta = supabase
    .from("archivos_visibles")
    .select("id, titulo, tipo, materia_nombre")
    .eq("estado", "aprobado");
  for (const p of buscadas) consulta = consulta.ilike("busqueda", `%${p}%`);

  const [{ data: materias }, { data: archivos }] = await Promise.all([
    supabase.from("materias").select("nombre, slug").eq("estado", "aprobado").order("nombre"),
    consulta.order("created_at", { ascending: false }).limit(6),
  ]);

  return NextResponse.json(
    {
      materias: (materias ?? []).filter((m) => coincide(m.nombre, buscadas)).slice(0, 5),
      archivos: (archivos ?? []).map((a) => ({
        id: a.id,
        titulo: a.titulo,
        detalle: `${TIPOS_MATERIAL[a.tipo as TipoMaterial]} · ${a.materia_nombre}`,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
