"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { TAG_CATALOGO } from "@/lib/cache";
import { limiteSubidaBytes, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { borrarDeR2, tamanoEnR2, urlDeSubida } from "@/lib/r2";
import {
  CUATRIMESTRES,
  EXTENSIONES_BLOQUEADAS,
  TIPOS_MATERIAL,
  extension,
  type Cuatrimestre,
  type TipoMaterial,
} from "@/lib/constants";
import {
  asegurarCatedra,
  asegurarPlan,
  obtenerOCrearCarrera,
  obtenerOCrearMateria,
  obtenerOCrearProfesor,
} from "@/lib/catalogo";

type Resultado<T> = { ok: true; data: T } | { ok: false; error: string };

export async function prepararSubida(archivo: {
  nombre: string;
  tamano: number;
  contentType: string;
}): Promise<Resultado<{ key: string; url: string; contentType: string }>> {
  const perfil = await requireUser();
  const ext = extension(archivo.nombre);
  const limite = limiteSubidaBytes(perfil);

  if (EXTENSIONES_BLOQUEADAS.includes(ext)) {
    return { ok: false, error: `No se permiten archivos .${ext}` };
  }
  if (archivo.tamano <= 0) return { ok: false, error: "El archivo está vacío." };
  if (archivo.tamano > limite) {
    return { ok: false, error: `El archivo supera el máximo de ${limite / 1024 / 1024} MB.` };
  }

  const contentType = archivo.contentType || "application/octet-stream";
  const key = `archivos/${perfil.id}/${randomUUID()}${ext ? `.${ext}` : ""}`;
  const url = await urlDeSubida(key, contentType, archivo.tamano);
  return { ok: true, data: { key, url, contentType } };
}

export type DatosSubida = {
  key: string;
  nombreOriginal: string;
  contentType: string;
  titulo: string;
  descripcion: string;
  tipo: TipoMaterial;
  anioCursada: number | null;
  anonimo: boolean;
  // Carrera: existente o propuesta
  carreraId: string | null;
  carreraNueva: string | null;
  // Materia: existente o propuesta (con año y cuatrimestre en la carrera)
  materiaId: string | null;
  materiaNueva: string | null;
  anioCarrera: number | null;
  cuatrimestre: Cuatrimestre | null;
  // Profesor: existente, propuesto o ninguno (General)
  profesorId: string | null;
  profesorNuevo: string | null;
};

export async function confirmarSubida(d: DatosSubida): Promise<Resultado<{ id: string }>> {
  const perfil = await requireUser();
  const db = createAdminClient();
  const esAdmin = perfil.rol === "admin";
  const estadoNuevo = esAdmin ? "aprobado" : "pendiente";

  const fallar = async (error: string): Promise<Resultado<never>> => {
    await borrarDeR2(d.key).catch(() => {});
    return { ok: false, error };
  };

  // El objeto tiene que ser del usuario y existir con un tamaño válido.
  if (!d.key.startsWith(`archivos/${perfil.id}/`)) return { ok: false, error: "Subida inválida." };
  const tamano = await tamanoEnR2(d.key);
  if (tamano === null) return { ok: false, error: "No se encontró el archivo subido. Probá de nuevo." };
  if (tamano > limiteSubidaBytes(perfil)) return fallar("El archivo supera el tamaño máximo.");

  const titulo = d.titulo.trim();
  if (!titulo) return fallar("Poné un título.");
  if (!(d.tipo in TIPOS_MATERIAL)) return fallar("Tipo de material inválido.");
  if (d.anioCursada !== null && (d.anioCursada < 1990 || d.anioCursada > 2100)) {
    return fallar("Año de cursada inválido.");
  }

  try {
    // Materia
    let materiaId = d.materiaId;
    if (!materiaId) {
      const nombre = d.materiaNueva?.trim();
      if (!nombre) return fallar("Elegí o proponé una materia.");
      if (!d.anioCarrera || d.anioCarrera < 1 || d.anioCarrera > 7) return fallar("Indicá en qué año se cursa la materia.");
      if (!d.cuatrimestre || !(d.cuatrimestre in CUATRIMESTRES)) return fallar("Indicá el cuatrimestre.");

      let carreraId = d.carreraId;
      if (!carreraId) {
        const nombreCarrera = d.carreraNueva?.trim();
        if (!nombreCarrera) return fallar("Elegí o proponé una carrera.");
        carreraId = await obtenerOCrearCarrera(db, nombreCarrera, estadoNuevo, perfil.id);
      }
      materiaId = await obtenerOCrearMateria(db, nombre, estadoNuevo, perfil.id);
      await asegurarPlan(db, carreraId, materiaId, d.anioCarrera, d.cuatrimestre);
    } else {
      const { data: materia } = await db.from("materias").select("id").eq("id", materiaId).maybeSingle();
      if (!materia) return fallar("La materia no existe.");
    }

    // Profesor (opcional)
    let profesorId = d.profesorId;
    if (!profesorId && d.profesorNuevo?.trim()) {
      profesorId = await obtenerOCrearProfesor(db, d.profesorNuevo, estadoNuevo, perfil.id);
    }
    if (profesorId) await asegurarCatedra(db, materiaId, profesorId);

    const { data, error } = await db
      .from("archivos")
      .insert({
        titulo,
        descripcion: d.descripcion.trim() || null,
        tipo: d.tipo,
        materia_id: materiaId,
        profesor_id: profesorId,
        anio_cursada: d.anioCursada,
        storage_key: d.key,
        nombre_original: d.nombreOriginal,
        mime: d.contentType,
        tamano,
        anonimo: d.anonimo,
        estado: estadoNuevo,
        subido_por: perfil.id,
        ...(esAdmin && { revisado_por: perfil.id, revisado_at: new Date().toISOString() }),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    revalidatePath("/", "layout");
    revalidateTag(TAG_CATALOGO);
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return fallar(e instanceof Error ? e.message : "Error inesperado.");
  }
}
