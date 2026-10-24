import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { ControlesEntidad } from "../fila-entidad";

export const metadata: Metadata = { title: "Profesores" };

export default async function ProfesoresPage() {
  const db = createAdminClient();
  const [{ data: profesores }, { data: catedras }, { data: archivos }] = await Promise.all([
    db.from("profesores").select("id, nombre, estado").neq("estado", "rechazado").order("nombre"),
    db.from("catedras").select("profesor_id, materias(nombre)"),
    db.from("archivos").select("profesor_id").not("profesor_id", "is", null),
  ]);

  const aprobados = (profesores ?? []).filter((p) => p.estado === "aprobado");
  const archivosDe = (id: string) => (archivos ?? []).filter((a) => a.profesor_id === id).length;
  const materiasDe = (id: string) =>
    (catedras ?? [])
      .filter((c) => c.profesor_id === id)
      .map((c) => (c.materias as unknown as { nombre: string } | null)?.nombre)
      .filter(Boolean)
      .join(", ");

  return (
    <div>
      <p className="mb-4 text-sm text-tenue">
        Para asignar un profesor a una materia, andá a «Carreras y materias» y abrí la materia.
        Si hay dos profesores que son la misma persona, usá «Fusionar».
      </p>
      <ul className="space-y-3">
        {(profesores ?? []).map((p) => (
          <li key={p.id} className="tarjeta p-4">
            <ControlesEntidad
              entidad="profesores"
              id={p.id}
              nombre={p.nombre}
              estado={p.estado}
              opcionesFusion={aprobados}
              detalle={
                <p className="text-xs text-tenue">
                  {materiasDe(p.id) || "Sin materias"} · {archivosDe(p.id)} archivos
                </p>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
