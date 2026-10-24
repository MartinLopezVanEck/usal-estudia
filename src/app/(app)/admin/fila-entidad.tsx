import {
  cambiarEstadoEntidad,
  eliminarEntidad,
  fusionarEntidad,
  renombrarEntidad,
} from "./actions";

type Entidad = "carreras" | "materias" | "profesores";

/** Controles de admin para una carrera/materia/profesor: renombrar, aprobar, fusionar, borrar. */
export function ControlesEntidad({
  entidad,
  id,
  nombre,
  estado,
  opcionesFusion,
  detalle,
}: {
  entidad: Entidad;
  id: string;
  nombre: string;
  estado: string;
  opcionesFusion: { id: string; nombre: string }[];
  detalle?: React.ReactNode;
}) {
  const ocultos = (
    <>
      <input type="hidden" name="entidad" value={entidad} />
      <input type="hidden" name="id" value={id} />
    </>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={renombrarEntidad} className="flex min-w-0 flex-1 gap-2">
          {ocultos}
          <input name="nombre" defaultValue={nombre} className="input min-w-40 flex-1" aria-label="Nombre" />
          <button className="btn-secundario">Guardar</button>
        </form>
        {estado === "pendiente" && (
          <>
            <form action={cambiarEstadoEntidad}>
              {ocultos}
              <input type="hidden" name="estado" value="aprobado" />
              <button className="btn-primario">Aprobar</button>
            </form>
            <form action={cambiarEstadoEntidad}>
              {ocultos}
              <input type="hidden" name="estado" value="rechazado" />
              <button className="btn-secundario">Rechazar</button>
            </form>
          </>
        )}
      </div>
      {detalle}
      <details className="text-sm">
        <summary className="cursor-pointer text-tenue">Más opciones</summary>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {opcionesFusion.length > 0 && (
            <form action={fusionarEntidad} className="flex flex-wrap items-center gap-2">
              {ocultos}
              <span>Es un duplicado de</span>
              <select name="destino" className="input w-auto" required defaultValue="">
                <option value="" disabled>Elegir...</option>
                {opcionesFusion
                  .filter((o) => o.id !== id)
                  .map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
              </select>
              <button className="btn-secundario">Fusionar</button>
            </form>
          )}
          <form action={eliminarEntidad}>
            {ocultos}
            <button className="btn-peligro">Eliminar</button>
          </form>
        </div>
      </details>
    </div>
  );
}
