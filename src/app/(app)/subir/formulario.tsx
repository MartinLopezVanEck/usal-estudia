"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CUATRIMESTRES,
  EXTENSIONES_BLOQUEADAS,
  TIPOS_MATERIAL,
  detectarAnioCursada,
  detectarTipo,
  extension,
  formatearTamano,
  type Cuatrimestre,
  type TipoMaterial,
} from "@/lib/constants";
import { confirmarSubida, prepararSubida } from "./actions";

type Item = { id: string; nombre: string; estado: string };

export type Catalogo = {
  carreras: Item[];
  materias: Item[];
  plan: { carrera_id: string; materia_id: string; anio: number; cuatrimestre: Cuatrimestre }[];
  profesores: Item[];
  catedras: { materia_id: string; profesor_id: string }[];
};

type ArchivoEnCola = {
  clave: string;
  file: File;
  titulo: string;
  tipo: TipoMaterial;
  anioCursada: string;
};

const NUEVO = "__nuevo__";
const NINGUNO = "";
const MAX_ARCHIVOS = 50;

function etiqueta(item: Item) {
  return item.estado === "pendiente" ? `${item.nombre} (pendiente)` : item.nombre;
}

/** Sube con XMLHttpRequest para poder mostrar el progreso. */
function subirConProgreso(url: string, archivo: File, contentType: string, onProgreso: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgreso(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Error ${xhr.status} al subir`)));
    xhr.onerror = () => reject(new Error("Error de red al subir el archivo"));
    xhr.send(archivo);
  });
}

export function FormularioSubida({
  catalogo,
  limiteBytes,
  materiaInicial,
}: {
  catalogo: Catalogo;
  limiteBytes: number;
  materiaInicial?: string;
}) {
  const router = useRouter();
  const planInicial = catalogo.plan.find((p) => p.materia_id === materiaInicial);

  const [cola, setCola] = useState<ArchivoEnCola[]>([]);
  const [carrera, setCarrera] = useState(planInicial?.carrera_id ?? "");
  const [carreraNueva, setCarreraNueva] = useState("");
  const [materia, setMateria] = useState(planInicial ? materiaInicial! : "");
  const [materiaNueva, setMateriaNueva] = useState("");
  const [anioCarrera, setAnioCarrera] = useState("1");
  const [cuatrimestre, setCuatrimestre] = useState<Cuatrimestre>("primero");
  const [profesor, setProfesor] = useState(NINGUNO);
  const [profesorNuevo, setProfesorNuevo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [anonimo, setAnonimo] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<{ indice: number; progreso: number } | null>(null);

  const materiasDeCarrera = useMemo(() => {
    const ids = new Set(catalogo.plan.filter((p) => p.carrera_id === carrera).map((p) => p.materia_id));
    return catalogo.materias.filter((m) => ids.has(m.id));
  }, [catalogo, carrera]);

  // Profesores de la materia primero, después el resto.
  const [profesDeMateria, otrosProfes] = useMemo(() => {
    const ids = new Set(catalogo.catedras.filter((c) => c.materia_id === materia).map((c) => c.profesor_id));
    return [
      catalogo.profesores.filter((p) => ids.has(p.id)),
      catalogo.profesores.filter((p) => !ids.has(p.id)),
    ];
  }, [catalogo, materia]);

  function agregarArchivos(lista: FileList | null) {
    if (!lista) return;
    const rechazados: string[] = [];
    const nuevos: ArchivoEnCola[] = [];
    for (const f of Array.from(lista)) {
      const ext = extension(f.name);
      if (EXTENSIONES_BLOQUEADAS.includes(ext)) rechazados.push(`${f.name}: no se permiten .${ext}`);
      else if (f.size > limiteBytes) rechazados.push(`${f.name}: pesa ${formatearTamano(f.size)} (máx. ${formatearTamano(limiteBytes)})`);
      else if (f.size === 0) rechazados.push(`${f.name}: está vacío`);
      else
        nuevos.push({
          clave: `${f.name}-${f.size}-${f.lastModified}`,
          file: f,
          titulo: f.name.replace(/\.[^.]+$/, ""),
          tipo: detectarTipo(f.name),
          anioCursada: detectarAnioCursada(f.name),
        });
    }
    setCola((actual) => {
      const claves = new Set(actual.map((a) => a.clave));
      const combinada = [...actual, ...nuevos.filter((n) => !claves.has(n.clave))];
      if (combinada.length > MAX_ARCHIVOS) rechazados.push(`Máximo ${MAX_ARCHIVOS} archivos por tanda.`);
      return combinada.slice(0, MAX_ARCHIVOS);
    });
    setError(rechazados.length ? rechazados.join("\n") : null);
  }

  function editar(clave: string, cambios: Partial<ArchivoEnCola>) {
    setCola((actual) => actual.map((a) => (a.clave === clave ? { ...a, ...cambios } : a)));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (cola.length === 0) return setError("Elegí al menos un archivo.");
    setError(null);

    const carreraEsNueva = carrera === NUEVO;
    const materiaEsNueva = carreraEsNueva || materia === NUEVO;
    const subidos: string[] = [];

    for (const [indice, item] of cola.entries()) {
      setSubiendo({ indice, progreso: 0 });
      try {
        const prep = await prepararSubida({
          nombre: item.file.name,
          tamano: item.file.size,
          contentType: item.file.type,
        });
        if (!prep.ok) throw new Error(prep.error);

        await subirConProgreso(prep.data.url, item.file, prep.data.contentType, (progreso) =>
          setSubiendo({ indice, progreso }),
        );

        const res = await confirmarSubida({
          key: prep.data.key,
          nombreOriginal: item.file.name,
          contentType: prep.data.contentType,
          titulo: item.titulo,
          descripcion: cola.length === 1 ? descripcion : "",
          tipo: item.tipo,
          anioCursada: item.anioCursada ? Number(item.anioCursada) : null,
          anonimo,
          carreraId: carreraEsNueva ? null : carrera || null,
          carreraNueva: carreraEsNueva ? carreraNueva : null,
          materiaId: materiaEsNueva ? null : materia || null,
          materiaNueva: materiaEsNueva ? materiaNueva : null,
          anioCarrera: materiaEsNueva ? Number(anioCarrera) : null,
          cuatrimestre: materiaEsNueva ? cuatrimestre : null,
          profesorId: profesor && profesor !== NUEVO ? profesor : null,
          profesorNuevo: profesor === NUEVO ? profesorNuevo : null,
        });
        if (!res.ok) throw new Error(res.error);
        subidos.push(res.data.id);
      } catch (err) {
        // Saco de la cola lo que ya se subió para que reintentar no duplique.
        setCola((actual) => actual.slice(indice));
        setError(`«${item.file.name}»: ${err instanceof Error ? err.message : "Error inesperado."}`);
        setSubiendo(null);
        return;
      }
    }

    router.push(subidos.length === 1 ? `/archivos/${subidos[0]}` : "/mis-aportes");
  }

  const enviando = subiendo !== null;
  const carreraEsNueva = carrera === NUEVO;
  const materiaEsNueva = carreraEsNueva || materia === NUEVO;

  return (
    <form onSubmit={enviar} className="mt-6 space-y-6">
      <fieldset className="tarjeta space-y-4 p-5" disabled={enviando}>
        <legend className="px-1 text-sm font-semibold">Archivos</legend>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-borde px-4 py-8 text-center hover:border-acento">
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              agregarArchivos(e.target.files);
              e.target.value = "";
            }}
          />
          <span className="font-medium">{cola.length ? "Agregar más archivos" : "Elegí uno o varios archivos"}</span>
          <span className="text-sm text-tenue">
            PDF, imágenes, Word, PowerPoint, zip, txt... hasta {formatearTamano(limiteBytes)} cada uno
          </span>
        </label>

        {cola.length > 0 && (
          <ul className="space-y-3">
            {cola.map((a, i) => (
              <li key={a.clave} className="rounded-lg border border-borde p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs text-tenue">
                  <span className="truncate font-mono">
                    {a.file.name} · {formatearTamano(a.file.size)}
                  </span>
                  {subiendo?.indice === i ? (
                    <span className="shrink-0 text-acento">{Math.round(subiendo.progreso * 100)}%</span>
                  ) : (
                    <button
                      type="button"
                      className="shrink-0 hover:text-peligro"
                      onClick={() => setCola((actual) => actual.filter((x) => x.clave !== a.clave))}
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_6rem]">
                  <input
                    className="input"
                    value={a.titulo}
                    onChange={(e) => editar(a.clave, { titulo: e.target.value })}
                    aria-label="Título"
                    placeholder="Título"
                    required
                    maxLength={200}
                  />
                  <select
                    className="input"
                    value={a.tipo}
                    onChange={(e) => editar(a.clave, { tipo: e.target.value as TipoMaterial })}
                    aria-label="Tipo"
                  >
                    {Object.entries(TIPOS_MATERIAL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input"
                    value={a.anioCursada}
                    onChange={(e) => editar(a.clave, { anioCursada: e.target.value })}
                    aria-label="Año de cursada"
                    placeholder="Año"
                    min={1990}
                    max={2100}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <fieldset className="tarjeta space-y-4 p-5" disabled={enviando}>
        <legend className="px-1 text-sm font-semibold">¿De qué materia {cola.length > 1 ? "son" : "es"}?</legend>

        <div>
          <label className="etiqueta" htmlFor="carrera">Carrera</label>
          <select
            id="carrera"
            className="input"
            value={carrera}
            onChange={(e) => {
              setCarrera(e.target.value);
              setMateria("");
            }}
            required
          >
            <option value="" disabled>Elegí una carrera</option>
            {catalogo.carreras.map((c) => (
              <option key={c.id} value={c.id}>{etiqueta(c)}</option>
            ))}
            <option value={NUEVO}>+ Mi carrera no está (proponer)</option>
          </select>
          {carreraEsNueva && (
            <input
              className="input mt-2"
              placeholder="Nombre de la carrera"
              value={carreraNueva}
              onChange={(e) => setCarreraNueva(e.target.value)}
              required
            />
          )}
        </div>

        {carrera && !carreraEsNueva && (
          <div>
            <label className="etiqueta" htmlFor="materia">Materia</label>
            <select
              id="materia"
              className="input"
              value={materia}
              onChange={(e) => {
                setMateria(e.target.value);
                setProfesor(NINGUNO);
              }}
              required
            >
              <option value="" disabled>Elegí una materia</option>
              {materiasDeCarrera.map((m) => (
                <option key={m.id} value={m.id}>{etiqueta(m)}</option>
              ))}
              <option value={NUEVO}>+ La materia no está (proponer)</option>
            </select>
          </div>
        )}

        {materiaEsNueva && carrera && (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              className="input"
              placeholder="Nombre de la materia"
              value={materiaNueva}
              onChange={(e) => setMateriaNueva(e.target.value)}
              required
            />
            <select className="input" value={anioCarrera} onChange={(e) => setAnioCarrera(e.target.value)} aria-label="Año">
              {[1, 2, 3, 4, 5, 6].map((a) => (
                <option key={a} value={a}>{a}° Año</option>
              ))}
            </select>
            <select
              className="input"
              value={cuatrimestre}
              onChange={(e) => setCuatrimestre(e.target.value as Cuatrimestre)}
              aria-label="Cuatrimestre"
            >
              {Object.entries(CUATRIMESTRES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        )}

        {(materia || materiaEsNueva) && carrera && (
          <div>
            <label className="etiqueta" htmlFor="profesor">Profesor / cátedra</label>
            <select id="profesor" className="input" value={profesor} onChange={(e) => setProfesor(e.target.value)}>
              <option value={NINGUNO}>General (no es de un profesor en particular)</option>
              {profesDeMateria.length > 0 && (
                <optgroup label="Profesores de esta materia">
                  {profesDeMateria.map((p) => (
                    <option key={p.id} value={p.id}>{etiqueta(p)}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label={profesDeMateria.length > 0 ? "Otros profesores" : "Profesores"}>
                {otrosProfes.map((p) => (
                  <option key={p.id} value={p.id}>{etiqueta(p)}</option>
                ))}
              </optgroup>
              <option value={NUEVO}>+ El profesor no está (proponer)</option>
            </select>
            {profesor === NUEVO && (
              <input
                className="input mt-2"
                placeholder="Apellido del profesor (ej. Baldino)"
                value={profesorNuevo}
                onChange={(e) => setProfesorNuevo(e.target.value)}
                required
              />
            )}
          </div>
        )}
      </fieldset>

      <fieldset className="tarjeta space-y-4 p-5" disabled={enviando}>
        <legend className="px-1 text-sm font-semibold">Opciones</legend>
        {cola.length <= 1 && (
          <div>
            <label className="etiqueta" htmlFor="descripcion">Descripción (opcional)</label>
            <textarea
              id="descripcion"
              className="input min-h-20"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="¿Qué temas cubre? ¿Está resuelto?"
              maxLength={2000}
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
          Subir de forma anónima (los admins igual pueden ver quién lo subió)
        </label>
      </fieldset>

      {error && <p className="whitespace-pre-line rounded-lg bg-peligro/10 px-3 py-2 text-sm text-peligro">{error}</p>}

      <div className="flex items-center gap-4">
        <button type="submit" className="btn-primario" disabled={enviando || cola.length === 0}>
          {enviando
            ? `Subiendo ${subiendo.indice + 1} de ${cola.length}...`
            : cola.length > 1
              ? `Subir ${cola.length} archivos`
              : "Subir"}
        </button>
        {enviando && (
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-borde">
            <div
              className="h-full bg-acento transition-all"
              style={{ width: `${Math.round(((subiendo.indice + subiendo.progreso) / cola.length) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </form>
  );
}
