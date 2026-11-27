import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TIPOS_MATERIAL, formatearTamano } from "@/lib/constants";
import { COLUMNAS_ARCHIVO, type ArchivoVisible } from "@/components/lista-archivos";
import { AccionesRevision } from "./acciones-revision";
import { ControlesEntidad } from "./fila-entidad";

export const metadata: Metadata = { title: "Pendientes" };

const TITULOS = { carreras: "Carreras propuestas", materias: "Materias propuestas", profesores: "Profesores propuestos" };

export default async function AdminPendientesPage() {
  const supabase = await createClient();
  const db = createAdminClient();

  const [{ data: archivosData }, ...entidades] = await Promise.all([
    supabase
      .from("archivos_visibles")
      .select(COLUMNAS_ARCHIVO)
      .eq("estado", "pendiente")
      .order("created_at"),
    ...(["carreras", "materias", "profesores"] as const).map(async (tabla) => {
      const { data } = await db
        .from(tabla)
        .select("id, nombre, estado, created_at, profiles:creado_por(nombre)")
        .order("nombre");
      return { tabla, todos: data ?? [] };
    }),
  ]);
  const archivos = (archivosData ?? []) as ArchivoVisible[];
  const propuestas = entidades.map((e) => ({
    ...e,
    pendientes: e.todos.filter((x) => x.estado === "pendiente"),
    aprobados: e.todos.filter((x) => x.estado === "aprobado"),
  }));
  const totalPropuestas = propuestas.reduce((t, p) => t + p.pendientes.length, 0);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-xl font-bold">Archivos pendientes ({archivos.length})</h1>
        <p className="mt-1 text-sm text-tenue">
          Al aprobar un archivo también se aprueban la materia, el profesor y la carrera que se propusieron con él.
          Si el nombre propuesto está mal o es un duplicado, corregilo abajo antes de aprobar.
        </p>
        {archivos.length === 0 ? (
          <p className="tarjeta mt-4 p-6 text-center text-sm text-tenue">No hay archivos para revisar.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {archivos.map((a) => (
              <li key={a.id} className="tarjeta p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/archivos/${a.id}`} className="font-medium hover:underline">
                      {a.titulo}
                    </Link>
                    <p className="mt-1 text-sm text-tenue">
                      {TIPOS_MATERIAL[a.tipo]} · {a.materia_nombre} · {a.profesor_nombre ?? "General"}
                      {a.anio_cursada && ` · ${a.anio_cursada}`} · {a.nombre_original} ({formatearTamano(a.tamano)})
                    </p>
                    <p className="text-sm text-tenue">
                      Por {a.autor_nombre} ({a.autor_email}){a.anonimo && " · pidió anonimato"}
                    </p>
                    {a.descripcion && <p className="mt-1 text-sm">{a.descripcion}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/archivos/${a.id}`} className="btn-secundario">Ver</Link>
                    <Link href={`/admin/archivos/${a.id}`} className="btn-secundario">Editar</Link>
                    <AccionesRevision id={a.id} estado={a.estado} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h1 className="text-xl font-bold">Propuestas ({totalPropuestas})</h1>
        {totalPropuestas === 0 && (
          <p className="tarjeta mt-4 p-6 text-center text-sm text-tenue">No hay propuestas pendientes.</p>
        )}
        {propuestas
          .filter((p) => p.pendientes.length > 0)
          .map(({ tabla, pendientes, aprobados }) => (
            <div key={tabla} className="mt-4">
              <h2 className="mb-2 text-sm font-semibold text-tenue">{TITULOS[tabla]}</h2>
              <ul className="space-y-3">
                {pendientes.map((e) => (
                  <li key={e.id} className="tarjeta p-4">
                    <ControlesEntidad
                      entidad={tabla}
                      id={e.id}
                      nombre={e.nombre}
                      estado={e.estado}
                      opcionesFusion={aprobados}
                      detalle={
                        <p className="text-xs text-tenue">
                          Propuesto por {(e.profiles as unknown as { nombre: string } | null)?.nombre ?? "?"} el{" "}
                          {new Date(e.created_at).toLocaleDateString("es-AR")}
                        </p>
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </section>
    </div>
  );
}
