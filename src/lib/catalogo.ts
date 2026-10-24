import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/slug";
import type { Cuatrimestre, EstadoRevision } from "@/lib/constants";

/**
 * Altas en el catálogo reutilizando lo existente: si ya hay una carrera,
 * materia o profesor con el mismo nombre (sin importar tildes/mayúsculas)
 * se devuelve ese en vez de crear un duplicado.
 */

type Db = SupabaseClient;

export async function obtenerOCrearCarrera(db: Db, nombre: string, estado: EstadoRevision, creadoPor: string) {
  const slug = slugify(nombre);
  const { data: existente } = await db.from("carreras").select("id").eq("slug", slug).maybeSingle();
  if (existente) return existente.id as string;

  const { data, error } = await db
    .from("carreras")
    .insert({ nombre: nombre.trim(), slug, estado, creado_por: creadoPor })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear la carrera: ${error.message}`);
  return data.id as string;
}

export async function obtenerOCrearMateria(db: Db, nombre: string, estado: EstadoRevision, creadoPor: string) {
  const slug = slugify(nombre);
  const { data: existente } = await db.from("materias").select("id").eq("slug", slug).maybeSingle();
  if (existente) return existente.id as string;

  const { data, error } = await db
    .from("materias")
    .insert({ nombre: nombre.trim(), slug, estado, creado_por: creadoPor })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear la materia: ${error.message}`);
  return data.id as string;
}

export async function obtenerOCrearProfesor(db: Db, nombre: string, estado: EstadoRevision, creadoPor: string) {
  const clave = slugify(nombre);
  const { data: todos } = await db.from("profesores").select("id, nombre");
  const existente = todos?.find((p) => slugify(p.nombre) === clave);
  if (existente) return existente.id as string;

  const { data, error } = await db
    .from("profesores")
    .insert({ nombre: nombre.trim(), estado, creado_por: creadoPor })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear el profesor: ${error.message}`);
  return data.id as string;
}

export async function asegurarPlan(
  db: Db,
  carreraId: string,
  materiaId: string,
  anio: number,
  cuatrimestre: Cuatrimestre,
) {
  // ignoreDuplicates: si la materia ya está en esa carrera no se pisa su año/cuatrimestre.
  const { error } = await db
    .from("plan_materias")
    .upsert(
      { carrera_id: carreraId, materia_id: materiaId, anio, cuatrimestre },
      { onConflict: "carrera_id,materia_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`No se pudo asociar la materia a la carrera: ${error.message}`);
}

export async function asegurarCatedra(db: Db, materiaId: string, profesorId: string) {
  const { error } = await db
    .from("catedras")
    .upsert(
      { materia_id: materiaId, profesor_id: profesorId },
      { onConflict: "materia_id,profesor_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`No se pudo asociar el profesor a la materia: ${error.message}`);
}
