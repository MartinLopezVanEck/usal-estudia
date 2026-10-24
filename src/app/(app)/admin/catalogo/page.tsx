import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { CUATRIMESTRES, type Cuatrimestre } from "@/lib/constants";
import {
  agregarMateriaACarrera,
  agregarProfesorAMateria,
  crearCarrera,
  quitarMateriaDeCarrera,
  quitarProfesorDeMateria,
} from "../actions";
import { ControlesEntidad } from "../fila-entidad";

export const metadata: Metadata = { title: "Carreras y materias" };

type Materia = { id: string; nombre: string; slug: string; estado: string };

export default async function CatalogoPage() {
  const db = createAdminClient();
  const [{ data: carreras }, { data: materias }, { data: plan }, { data: catedras }, { data: profesores }] =
    await Promise.all([
      db.from("carreras").select("id, nombre, slug, estado").neq("estado", "rechazado").order("nombre"),
      db.from("materias").select("id, nombre, slug, estado").neq("estado", "rechazado").order("nombre"),
      db.from("plan_materias").select("carrera_id, materia_id, anio, cuatrimestre"),
      db.from("catedras").select("materia_id, profesor_id"),
      db.from("profesores").select("id, nombre").neq("estado", "rechazado").order("nombre"),
    ]);

  const materiaPorId = new Map((materias ?? []).map((m) => [m.id, m as Materia]));
  const profePorId = new Map((profesores ?? []).map((p) => [p.id, p.nombre]));
  const materiasAprobadas = (materias ?? []).filter((m) => m.estado === "aprobado");
  const carrerasAprobadas = (carreras ?? []).filter((c) => c.estado === "aprobado");
  const conPlan = new Set((plan ?? []).map((p) => p.materia_id));
  const huerfanas = (materias ?? []).filter((m) => !conPlan.has(m.id));

  const profesDe = (materiaId: string) =>
    (catedras ?? [])
      .filter((c) => c.materia_id === materiaId)
      .map((c) => ({ id: c.profesor_id, nombre: profePorId.get(c.profesor_id) ?? "?" }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

  function FilaMateria({ m, carreraId, anio, cuatri }: { m: Materia; carreraId?: string; anio?: number; cuatri?: Cuatrimestre }) {
    return (
      <details className="rounded-lg border border-borde">
        <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm">
          <span className="font-medium">{m.nombre}</span>
          {anio && <span className="text-tenue">{anio}° · {CUATRIMESTRES[cuatri!]}</span>}
          {m.estado === "pendiente" && <span className="text-xs text-aviso">pendiente</span>}
          <span className="text-xs text-tenue">{profesDe(m.id).length} profesores</span>
        </summary>
        <div className="space-y-4 border-t border-borde p-3">
          <ControlesEntidad entidad="materias" id={m.id} nombre={m.nombre} estado={m.estado} opcionesFusion={materiasAprobadas} />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tenue">Profesores</p>
            <div className="flex flex-wrap gap-2">
              {profesDe(m.id).map((p) => (
                <form key={p.id} action={quitarProfesorDeMateria} className="flex items-center gap-1 rounded-full border border-borde py-0.5 pl-3 pr-1 text-sm">
                  <input type="hidden" name="materia_id" value={m.id} />
                  <input type="hidden" name="profesor_id" value={p.id} />
                  {p.nombre}
                  <button className="rounded-full px-1.5 text-tenue hover:text-peligro" title="Quitar de la materia">×</button>
                </form>
              ))}
              <form action={agregarProfesorAMateria} className="flex gap-1">
                <input type="hidden" name="materia_id" value={m.id} />
                <input name="nombre" list="lista-profesores" placeholder="Agregar profesor" className="input w-44 py-1" required />
                <button className="btn-secundario py-1">+</button>
              </form>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href={`/materias/${m.slug}`} className="text-acento hover:underline">Ver materia</Link>
            {carreraId && (
              <form action={quitarMateriaDeCarrera}>
                <input type="hidden" name="carrera_id" value={carreraId} />
                <input type="hidden" name="materia_id" value={m.id} />
                <button className="text-peligro hover:underline">Quitar de esta carrera</button>
              </form>
            )}
          </div>
        </div>
      </details>
    );
  }

  return (
    <div className="space-y-8">
      <datalist id="lista-profesores">
        {profesores?.map((p) => <option key={p.id} value={p.nombre} />)}
      </datalist>
      <datalist id="lista-materias">
        {materiasAprobadas.map((m) => <option key={m.id} value={m.nombre} />)}
      </datalist>

      <form action={crearCarrera} className="tarjeta flex flex-wrap gap-2 p-4">
        <input name="nombre" placeholder="Nueva carrera (ej. Ingeniería en Informática)" className="input flex-1" required />
        <button className="btn-primario">Crear carrera</button>
      </form>

      {(carreras ?? []).map((c) => {
        const filas = (plan ?? [])
          .filter((p) => p.carrera_id === c.id && materiaPorId.has(p.materia_id))
          .sort((a, b) => a.anio - b.anio || a.cuatrimestre.localeCompare(b.cuatrimestre) || materiaPorId.get(a.materia_id)!.nombre.localeCompare(materiaPorId.get(b.materia_id)!.nombre));

        return (
          <section key={c.id} className="tarjeta space-y-4 p-4">
            <ControlesEntidad entidad="carreras" id={c.id} nombre={c.nombre} estado={c.estado} opcionesFusion={carrerasAprobadas} />

            <div className="space-y-2">
              {filas.map((p) => (
                <FilaMateria key={p.materia_id} m={materiaPorId.get(p.materia_id)!} carreraId={c.id} anio={p.anio} cuatri={p.cuatrimestre} />
              ))}
              {filas.length === 0 && <p className="text-sm text-tenue">Sin materias todavía.</p>}
            </div>

            <form action={agregarMateriaACarrera} className="flex flex-wrap gap-2 border-t border-borde pt-4">
              <input type="hidden" name="carrera_id" value={c.id} />
              <input name="nombre" list="lista-materias" placeholder="Agregar materia (nueva o existente)" className="input min-w-48 flex-1" required />
              <select name="anio" className="input w-auto" aria-label="Año">
                {[1, 2, 3, 4, 5, 6].map((a) => <option key={a} value={a}>{a}° Año</option>)}
              </select>
              <select name="cuatrimestre" className="input w-auto" aria-label="Cuatrimestre">
                {Object.entries(CUATRIMESTRES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button className="btn-secundario">Agregar</button>
            </form>
          </section>
        );
      })}

      {huerfanas.length > 0 && (
        <section className="tarjeta space-y-2 p-4">
          <h2 className="font-semibold">Materias sin carrera</h2>
          {huerfanas.map((m) => <FilaMateria key={m.id} m={m as Materia} />)}
        </section>
      )}
    </div>
  );
}
