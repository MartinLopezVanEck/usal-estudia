import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { limiteSubidaBytes, requireUser } from "@/lib/auth";
import { FormularioSubida, type Catalogo } from "./formulario";

export const metadata: Metadata = { title: "Subir material" };

export default async function SubirPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const { materia } = await searchParams;
  const perfil = await requireUser();
  const supabase = await createClient();

  // RLS devuelve lo aprobado más lo que propuso el propio usuario.
  const [carreras, materias, plan, profesores, catedras] = await Promise.all([
    supabase.from("carreras").select("id, nombre, estado").neq("estado", "rechazado").order("nombre"),
    supabase.from("materias").select("id, nombre, estado").neq("estado", "rechazado").order("nombre"),
    supabase.from("plan_materias").select("carrera_id, materia_id, anio, cuatrimestre"),
    supabase.from("profesores").select("id, nombre, estado").neq("estado", "rechazado").order("nombre"),
    supabase.from("catedras").select("materia_id, profesor_id"),
  ]);

  const catalogo: Catalogo = {
    carreras: carreras.data ?? [],
    materias: materias.data ?? [],
    plan: plan.data ?? [],
    profesores: profesores.data ?? [],
    catedras: catedras.data ?? [],
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Subir material</h1>
      <p className="mt-1 text-sm text-tenue">
        {perfil.rol === "admin"
          ? "Como sos admin, lo que subas se publica directamente."
          : "Un admin va a revisar el archivo antes de publicarlo. Podés seguir el estado en «Mis aportes»."}
      </p>
      <FormularioSubida
        catalogo={catalogo}
        limiteBytes={limiteSubidaBytes(perfil)}
        materiaInicial={materia}
      />
    </div>
  );
}
