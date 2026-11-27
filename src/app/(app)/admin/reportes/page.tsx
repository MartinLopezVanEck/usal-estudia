import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOTIVOS_REPORTE, type MotivoReporte } from "@/lib/constants";
import { resolverReporte } from "../actions";

export const metadata: Metadata = { title: "Reportes" };

type Reporte = {
  id: string;
  motivo: MotivoReporte;
  detalle: string | null;
  created_at: string;
  archivo_id: string;
  archivos: { titulo: string } | null;
  profiles: { nombre: string; email: string } | null;
};

export default async function ReportesPage() {
  const { data, error } = await createAdminClient()
    .from("reportes")
    .select("id, motivo, detalle, created_at, archivo_id, archivos(titulo), profiles:usuario_id(nombre, email)")
    .eq("resuelto", false)
    .order("created_at");
  const reportes = (data ?? []) as unknown as Reporte[];

  return (
    <section>
      <h1 className="text-xl font-bold">Reportes ({reportes.length})</h1>
      <p className="mt-1 text-sm text-tenue">
        Avisos de alumnos sobre archivos con problemas. Corregí el archivo (o borralo) y marcá el reporte como resuelto.
      </p>

      {error ? (
        <p className="tarjeta mt-4 p-6 text-center text-sm text-aviso">
          Falta correr la migración <span className="font-mono">0005_comunidad.sql</span> en Supabase.
        </p>
      ) : reportes.length === 0 ? (
        <p className="tarjeta mt-4 p-6 text-center text-sm text-tenue">No hay reportes pendientes.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reportes.map((r) => (
            <li key={r.id} className="tarjeta flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/archivos/${r.archivo_id}`} className="font-medium hover:underline">
                  {r.archivos?.titulo ?? "Archivo"}
                </Link>
                <p className="mt-1 text-sm">{MOTIVOS_REPORTE[r.motivo]}</p>
                {r.detalle && <p className="mt-1 whitespace-pre-line text-sm text-tenue">«{r.detalle}»</p>}
                <p className="mt-1 text-xs text-tenue">
                  {r.profiles ? `${r.profiles.nombre} (${r.profiles.email})` : "Usuario eliminado"} ·{" "}
                  {new Date(r.created_at).toLocaleDateString("es-AR")}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/archivos/${r.archivo_id}`} className="btn-secundario">
                  Editar archivo
                </Link>
                <form action={resolverReporte.bind(null, r.id)}>
                  <button className="btn-primario">Resuelto</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
