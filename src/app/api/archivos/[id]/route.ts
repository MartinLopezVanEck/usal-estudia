import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { urlDeDescarga } from "@/lib/r2";
import { contentTypeVistaPrevia } from "@/lib/constants";

/**
 * Redirige a una URL firmada de R2.
 * ?ver=1 la abre en el navegador (vista previa), si no la descarga.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // La vista solo devuelve el archivo si el usuario tiene permiso de verlo.
  const { data: visible } = await supabase
    .from("archivos_visibles")
    .select("id, nombre_original")
    .eq("id", id)
    .maybeSingle();
  if (!visible) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { data: archivo } = await createAdminClient()
    .from("archivos")
    .select("storage_key")
    .eq("id", id)
    .single();
  if (!archivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const ver = new URL(request.url).searchParams.has("ver");
  const url = await urlDeDescarga(archivo.storage_key, visible.nombre_original, {
    inline: ver,
    contentType: ver ? contentTypeVistaPrevia(visible.nombre_original) : null,
  });
  return NextResponse.redirect(url);
}
