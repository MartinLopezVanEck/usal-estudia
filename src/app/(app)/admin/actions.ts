"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { borrarDeR2 } from "@/lib/r2";
import { slugify } from "@/lib/slug";
import { TAG_CATALOGO } from "@/lib/cache";
import { CUATRIMESTRES, TIPOS_MATERIAL, type Cuatrimestre } from "@/lib/constants";
import {
  asegurarCatedra,
  asegurarPlan,
  obtenerOCrearCarrera,
  obtenerOCrearMateria,
  obtenerOCrearProfesor,
} from "@/lib/catalogo";

type Entidad = "carreras" | "materias" | "profesores";
const ENTIDADES: Entidad[] = ["carreras", "materias", "profesores"];

function texto(fd: FormData, campo: string) {
  return String(fd.get(campo) ?? "").trim();
}

function entidad(fd: FormData): Entidad {
  const e = texto(fd, "entidad") as Entidad;
  if (!ENTIDADES.includes(e)) throw new Error("Entidad inválida");
  return e;
}

function refrescar() {
  revalidatePath("/", "layout");
  revalidateTag(TAG_CATALOGO);
}

// ---------------------------------------------------------------------------
// Revisión de archivos
// ---------------------------------------------------------------------------

/** Aprueba el archivo y todo lo que propuso junto con él (materia, profesor, carrera). */
export async function aprobarArchivo(id: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { data: archivo } = await db
    .from("archivos")
    .select("materia_id, profesor_id")
    .eq("id", id)
    .single();
  if (!archivo) throw new Error("Archivo no encontrado");

  await db.from("materias").update({ estado: "aprobado" }).eq("id", archivo.materia_id).eq("estado", "pendiente");
  if (archivo.profesor_id) {
    await db.from("profesores").update({ estado: "aprobado" }).eq("id", archivo.profesor_id).eq("estado", "pendiente");
  }
  const { data: plan } = await db.from("plan_materias").select("carrera_id").eq("materia_id", archivo.materia_id);
  const carreras = (plan ?? []).map((p) => p.carrera_id);
  if (carreras.length) {
    await db.from("carreras").update({ estado: "aprobado" }).in("id", carreras).eq("estado", "pendiente");
  }

  await db
    .from("archivos")
    .update({ estado: "aprobado", motivo_rechazo: null, revisado_por: admin.id, revisado_at: new Date().toISOString() })
    .eq("id", id);
  refrescar();
}

export async function rechazarArchivo(id: string, motivo: string) {
  const admin = await requireAdmin();
  await createAdminClient()
    .from("archivos")
    .update({
      estado: "rechazado",
      motivo_rechazo: motivo.trim() || null,
      revisado_por: admin.id,
      revisado_at: new Date().toISOString(),
    })
    .eq("id", id);
  refrescar();
}

export async function eliminarArchivo(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { data } = await db.from("archivos").select("storage_key").eq("id", id).single();
  if (!data) return;
  await borrarDeR2(data.storage_key);
  await db.from("archivos").delete().eq("id", id);
  refrescar();
}

export async function editarArchivo(fd: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const id = texto(fd, "id");
  const tipo = texto(fd, "tipo");
  if (!(tipo in TIPOS_MATERIAL)) throw new Error("Tipo inválido");
  const anio = texto(fd, "anio_cursada");
  const materiaId = texto(fd, "materia_id");
  const profesorId = texto(fd, "profesor_id") || null;

  await db
    .from("archivos")
    .update({
      titulo: texto(fd, "titulo"),
      descripcion: texto(fd, "descripcion") || null,
      tipo,
      materia_id: materiaId,
      profesor_id: profesorId,
      anio_cursada: anio ? Number(anio) : null,
      anonimo: fd.get("anonimo") === "on",
    })
    .eq("id", id);
  if (profesorId) await asegurarCatedra(db, materiaId, profesorId);

  refrescar();
  redirect(`/archivos/${id}`);
}

// ---------------------------------------------------------------------------
// Propuestas y catálogo
// ---------------------------------------------------------------------------

export async function cambiarEstadoEntidad(fd: FormData) {
  await requireAdmin();
  const estado = texto(fd, "estado");
  if (estado !== "aprobado" && estado !== "rechazado") throw new Error("Estado inválido");
  await createAdminClient().from(entidad(fd)).update({ estado }).eq("id", texto(fd, "id"));
  refrescar();
}

export async function renombrarEntidad(fd: FormData) {
  await requireAdmin();
  const tabla = entidad(fd);
  const nombre = texto(fd, "nombre");
  if (!nombre) return;
  const cambios = tabla === "profesores" ? { nombre } : { nombre, slug: slugify(nombre) };
  const { error } = await createAdminClient().from(tabla).update(cambios).eq("id", texto(fd, "id"));
  if (error) throw new Error(error.code === "23505" ? `Ya existe "${nombre}". Usá «Fusionar».` : error.message);
  refrescar();
}

export async function eliminarEntidad(fd: FormData) {
  await requireAdmin();
  const tabla = entidad(fd);
  const id = texto(fd, "id");
  const db = createAdminClient();

  if (tabla === "materias") {
    const { count } = await db.from("archivos").select("id", { count: "exact", head: true }).eq("materia_id", id);
    if (count) throw new Error("La materia tiene archivos: movelos o fusioná la materia antes de borrarla.");
  }
  // Profesores: sus archivos pasan a "General" (on delete set null).
  // Carreras: se borra solo el plan; las materias quedan.
  await db.from(tabla).delete().eq("id", id);
  refrescar();
}

/** Mueve todo lo de `origen` a `destino` y borra `origen`. Útil para duplicados. */
export async function fusionarEntidad(fd: FormData) {
  await requireAdmin();
  const tabla = entidad(fd);
  const origen = texto(fd, "id");
  const destino = texto(fd, "destino");
  if (!destino || origen === destino) return;
  const db = createAdminClient();

  if (tabla === "profesores") {
    await db.from("archivos").update({ profesor_id: destino }).eq("profesor_id", origen);
    const { data: cats } = await db.from("catedras").select("materia_id").eq("profesor_id", origen);
    for (const c of cats ?? []) await asegurarCatedra(db, c.materia_id, destino);
  } else if (tabla === "materias") {
    await db.from("archivos").update({ materia_id: destino }).eq("materia_id", origen);
    const { data: cats } = await db.from("catedras").select("profesor_id").eq("materia_id", origen);
    for (const c of cats ?? []) await asegurarCatedra(db, destino, c.profesor_id);
    const { data: planes } = await db.from("plan_materias").select("*").eq("materia_id", origen);
    for (const p of planes ?? []) await asegurarPlan(db, p.carrera_id, destino, p.anio, p.cuatrimestre);
  } else {
    const { data: planes } = await db.from("plan_materias").select("*").eq("carrera_id", origen);
    for (const p of planes ?? []) await asegurarPlan(db, destino, p.materia_id, p.anio, p.cuatrimestre);
  }

  await db.from(tabla).update({ estado: "aprobado" }).eq("id", destino);
  await db.from(tabla).delete().eq("id", origen);
  refrescar();
}

export async function crearCarrera(fd: FormData) {
  const admin = await requireAdmin();
  const nombre = texto(fd, "nombre");
  if (!nombre) return;
  const db = createAdminClient();
  const id = await obtenerOCrearCarrera(db, nombre, "aprobado", admin.id);
  await db.from("carreras").update({ estado: "aprobado" }).eq("id", id);
  refrescar();
}

/** Agrega una materia (nueva o existente por nombre) al plan de una carrera. */
export async function agregarMateriaACarrera(fd: FormData) {
  const admin = await requireAdmin();
  const nombre = texto(fd, "nombre");
  const anio = Number(texto(fd, "anio"));
  const cuatrimestre = texto(fd, "cuatrimestre") as Cuatrimestre;
  if (!nombre || !(anio >= 1 && anio <= 7) || !(cuatrimestre in CUATRIMESTRES)) return;

  const db = createAdminClient();
  const materiaId = await obtenerOCrearMateria(db, nombre, "aprobado", admin.id);
  await db.from("materias").update({ estado: "aprobado" }).eq("id", materiaId);
  await db
    .from("plan_materias")
    .upsert({ carrera_id: texto(fd, "carrera_id"), materia_id: materiaId, anio, cuatrimestre });
  refrescar();
}

export async function quitarMateriaDeCarrera(fd: FormData) {
  await requireAdmin();
  await createAdminClient()
    .from("plan_materias")
    .delete()
    .eq("carrera_id", texto(fd, "carrera_id"))
    .eq("materia_id", texto(fd, "materia_id"));
  refrescar();
}

export async function agregarProfesorAMateria(fd: FormData) {
  const admin = await requireAdmin();
  const nombre = texto(fd, "nombre");
  if (!nombre) return;
  const db = createAdminClient();
  const profesorId = await obtenerOCrearProfesor(db, nombre, "aprobado", admin.id);
  await db.from("profesores").update({ estado: "aprobado" }).eq("id", profesorId);
  await asegurarCatedra(db, texto(fd, "materia_id"), profesorId);
  refrescar();
}

export async function quitarProfesorDeMateria(fd: FormData) {
  await requireAdmin();
  await createAdminClient()
    .from("catedras")
    .delete()
    .eq("materia_id", texto(fd, "materia_id"))
    .eq("profesor_id", texto(fd, "profesor_id"));
  refrescar();
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

export async function agregarCuentaExterna(fd: FormData) {
  await requireAdmin();
  const email = texto(fd, "email").toLowerCase();
  const rol = texto(fd, "rol") === "alumno" ? "alumno" : "admin";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Mail inválido");

  const db = createAdminClient();
  await db.from("cuentas_externas").upsert({ email, rol });
  // Si ya había ingresado alguna vez, se actualiza su rol también.
  await db.from("profiles").update({ rol }).eq("email", email);
  refrescar();
}

/** Quita la autorización y borra la cuenta (sus archivos quedan, sin autor). */
export async function quitarCuentaExterna(fd: FormData) {
  const admin = await requireAdmin();
  const email = texto(fd, "email").toLowerCase();
  if (email === admin.email) throw new Error("No podés quitarte el acceso a vos mismo.");

  const db = createAdminClient();
  await db.from("cuentas_externas").delete().eq("email", email);
  const { data: perfil } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (perfil) await db.auth.admin.deleteUser(perfil.id);
  refrescar();
}

export async function cambiarRol(fd: FormData) {
  const admin = await requireAdmin();
  const id = texto(fd, "id");
  const rol = texto(fd, "rol");
  if (rol !== "admin" && rol !== "alumno") throw new Error("Rol inválido");
  if (id === admin.id && rol === "alumno") throw new Error("No podés quitarte el rol de admin a vos mismo.");

  await createAdminClient().from("profiles").update({ rol }).eq("id", id);
  refrescar();
}
