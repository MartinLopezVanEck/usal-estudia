import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { COLUMNAS_ARCHIVO, ListaArchivos, type ArchivoVisible } from "@/components/lista-archivos";

export const metadata: Metadata = { title: "Mis aportes" };

export default async function MisAportesPage() {
  const perfil = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("archivos_visibles")
    .select(COLUMNAS_ARCHIVO)
    .eq("es_mio", true)
    .order("created_at", { ascending: false });
  const archivos = (data ?? []) as ArchivoVisible[];

  const aprobados = archivos.filter((a) => a.estado === "aprobado").length;

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Mis aportes</h1>
      <p className="mt-1 text-sm text-tenue">
        {perfil.nombre} · {archivos.length} subidos · {aprobados} publicados
      </p>
      <div className="mt-6">
        <ListaArchivos
          archivos={archivos}
          mostrarMateria
          mostrarEstado
          vacio="Todavía no subiste nada. ¡Gracias por sumar cuando puedas!"
        />
      </div>
    </div>
  );
}
