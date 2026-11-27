import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { urlDeDescarga } from "@/lib/r2";
import { contentTypeVistaPrevia } from "@/lib/constants";

/**
 * Redirige a una URL firmada de R2.
 * ?ver=1 la abre en el navegador (vista previa), si no la descarga.
 * (El visor ya firma las URLs directamente; esta ruta queda para links viejos y compartidos.)
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Las dos consultas van en paralelo; la clave solo se usa si la vista confirma el permiso.
  const [{ data: visible }, { data: archivo }] = await Promise.all([
    supabase.from("archivos_visibles").select("id, nombre_original").eq("id", id).maybeSingle(),
    createAdminClient().from("archivos").select("storage_key").eq("id", id).maybeSingle(),
  ]);
  if (!visible || !archivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const ver = new URL(request.url).searchParams.has("ver");
  const url = await urlDeDescarga(archivo.storage_key, visible.nombre_original, {
    inline: ver,
    contentType: ver ? contentTypeVistaPrevia(visible.nombre_original) : null,
  });
  return NextResponse.redirect(url);
}
