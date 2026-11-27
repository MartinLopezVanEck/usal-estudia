import { TIPOS_MATERIAL } from "./constants";
import type { ArchivoVisible } from "@/components/lista-archivos";

/**
 * Filtros y orden de la lista de archivos de una materia. Se comparten entre la
 * página de la materia y el visor, para que las flechas anterior/siguiente
 * recorran exactamente la misma lista que estabas viendo.
 */
export type FiltrosMateria = {
  carrera?: string;
  profesor?: string;
  tipo?: string;
  orden?: string;
  anio?: string;
};

const CLAVES = ["carrera", "profesor", "tipo", "orden", "anio"] as const;

const ORDEN_TIPOS = Object.keys(TIPOS_MATERIAL);

/** Los archivos sin año van siempre al final. */
function porAnio(a: ArchivoVisible, b: ArchivoVisible, sentido: 1 | -1) {
  if (a.anio_cursada === b.anio_cursada) return 0;
  if (a.anio_cursada === null) return 1;
  if (b.anio_cursada === null) return -1;
  return (a.anio_cursada - b.anio_cursada) * sentido;
}

const recientes = (a: ArchivoVisible, b: ArchivoVisible) =>
  porAnio(a, b, -1) || b.created_at.localeCompare(a.created_at);

export const ORDENES = {
  recientes: { etiqueta: "Más recientes", comparar: recientes },
  antiguos: {
    etiqueta: "Más antiguos",
    comparar: (a: ArchivoVisible, b: ArchivoVisible) => porAnio(a, b, 1) || a.titulo.localeCompare(b.titulo),
  },
  tipo: {
    etiqueta: "Por tipo",
    comparar: (a: ArchivoVisible, b: ArchivoVisible) =>
      ORDEN_TIPOS.indexOf(a.tipo) - ORDEN_TIPOS.indexOf(b.tipo) || recientes(a, b),
  },
};
export type Orden = keyof typeof ORDENES;

export function ordenValido(orden?: string): Orden {
  return orden && orden in ORDENES ? (orden as Orden) : "recientes";
}

export function leerFiltros(params: Record<string, string | string[] | undefined>): FiltrosMateria {
  const f: FiltrosMateria = {};
  for (const k of CLAVES) {
    const v = params[k];
    if (typeof v === "string" && v) f[k] = v;
  }
  return f;
}

/** Arma "?a=1&b=2" (o "") con los filtros y los cambios pedidos. */
export function consulta(filtros: FiltrosMateria, cambios: FiltrosMateria = {}) {
  const valores = { ...filtros, ...cambios };
  const q = new URLSearchParams();
  for (const k of CLAVES) {
    const v = valores[k];
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function filtrarYOrdenar(archivos: ArchivoVisible[], f: FiltrosMateria) {
  const orden = ORDENES[ordenValido(f.orden)];
  return archivos
    .filter(
      (a) =>
        (!f.profesor || (f.profesor === "general" ? a.profesor_id === null : a.profesor_id === f.profesor)) &&
        (!f.tipo || a.tipo === f.tipo) &&
        (!f.anio || String(a.anio_cursada) === f.anio),
    )
    .sort(orden.comparar);
}
