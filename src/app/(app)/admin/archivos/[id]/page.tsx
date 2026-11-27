import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TIPOS_MATERIAL } from "@/lib/constants";
import { editarArchivo } from "../../actions";

export default async function EditarArchivoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdminClient();

  const [{ data: a }, { data: materias }, { data: profesores }] = await Promise.all([
    db.from("archivos").select("*").eq("id", id).maybeSingle(),
    db.from("materias").select("id, nombre, estado").neq("estado", "rechazado").order("nombre"),
    db.from("profesores").select("id, nombre, estado").neq("estado", "rechazado").order("nombre"),
  ]);
  if (!a) notFound();

  const sufijo = (estado: string) => (estado === "pendiente" ? " (pendiente)" : "");

  return (
    <form action={editarArchivo} className="tarjeta mx-auto max-w-2xl space-y-4 p-5">
      <h1 className="text-xl font-bold">Editar archivo</h1>
      <p className="font-mono text-xs text-tenue">{a.nombre_original}</p>
      <input type="hidden" name="id" value={a.id} />

      <div>
        <label className="etiqueta" htmlFor="titulo">Título</label>
        <input id="titulo" name="titulo" className="input" defaultValue={a.titulo} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="etiqueta" htmlFor="materia_id">Materia</label>
          <select id="materia_id" name="materia_id" className="input" defaultValue={a.materia_id}>
            {materias?.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}{sufijo(m.estado)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="etiqueta" htmlFor="profesor_id">Profesor</label>
          <select id="profesor_id" name="profesor_id" className="input" defaultValue={a.profesor_id ?? ""}>
            <option value="">General</option>
            {profesores?.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}{sufijo(p.estado)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="etiqueta" htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" className="input" defaultValue={a.tipo}>
            {Object.entries(TIPOS_MATERIAL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="etiqueta" htmlFor="anio_cursada">Año de cursada</label>
          <input
            id="anio_cursada"
            name="anio_cursada"
            type="number"
            min={1990}
            max={2100}
            className="input"
            defaultValue={a.anio_cursada ?? ""}
          />
        </div>
      </div>
      <div>
        <label className="etiqueta" htmlFor="descripcion">Descripción</label>
        <textarea id="descripcion" name="descripcion" className="input min-h-20" defaultValue={a.descripcion ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="anonimo" defaultChecked={a.anonimo} /> Anónimo
      </label>
      <button className="btn-primario">Guardar</button>
    </form>
  );
}
