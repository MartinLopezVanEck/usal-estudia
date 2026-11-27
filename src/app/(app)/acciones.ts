"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOTIVOS_REPORTE, type MotivoReporte } from "@/lib/constants";

type Resultado = { ok: true } | { ok: false; error: string };

const SIN_TABLA = "Esta función todavía no está activada. Avisale a un admin.";

/** Solo se puede interactuar con archivos que el usuario puede ver. */
async function archivoVisible(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("archivos_visibles").select("id, materia_slug").eq("id", id).maybeSingle();
  return data;
}

/** Fija o desfija una materia en "Mis materias". */
export async function alternarFijada(materiaId: string, fijar: boolean): Promise<Resultado> {
  const perfil = await requireUser();
  const supabase = await createClient();
  const { error } = fijar
    ? await supabase
        .from("materias_fijadas")
        .upsert({ usuario_id: perfil.id, materia_id: materiaId }, { ignoreDuplicates: true })
    : await supabase.from("materias_fijadas").delete().eq("usuario_id", perfil.id).eq("materia_id", materiaId);
  if (error) return { ok: false, error: SIN_TABLA };
  revalidatePath("/carreras", "layout");
  return { ok: true };
}

/** Marca o desmarca un archivo como "Me sirvió". */
export async function alternarVoto(archivoId: string, votar: boolean): Promise<Resultado> {
  const perfil = await requireUser();
  const archivo = await archivoVisible(archivoId);
  if (!archivo) return { ok: false, error: "No encontramos el archivo." };

  const supabase = await createClient();
  const { error } = votar
    ? await supabase
        .from("archivo_votos")
        .upsert({ archivo_id: archivoId, usuario_id: perfil.id }, { ignoreDuplicates: true })
    : await supabase.from("archivo_votos").delete().eq("archivo_id", archivoId).eq("usuario_id", perfil.id);
  if (error) return { ok: false, error: SIN_TABLA };
  revalidatePath(`/materias/${archivo.materia_slug}`);
  return { ok: true };
}

/** Un alumno avisa que un archivo tiene un problema. Lo revisa un admin. */
export async function reportarArchivo(archivoId: string, motivo: string, detalle: string): Promise<Resultado> {
  const perfil = await requireUser();
  if (!(motivo in MOTIVOS_REPORTE)) return { ok: false, error: "Elegí un motivo." };
  if (!(await archivoVisible(archivoId))) return { ok: false, error: "No encontramos el archivo." };

  const { error } = await createAdminClient()
    .from("reportes")
    .insert({
      archivo_id: archivoId,
      usuario_id: perfil.id,
      motivo: motivo as MotivoReporte,
      detalle: detalle.trim().slice(0, 500) || null,
    });
  if (error) return { ok: false, error: SIN_TABLA };
  revalidatePath("/admin", "layout");
  return { ok: true };
}
