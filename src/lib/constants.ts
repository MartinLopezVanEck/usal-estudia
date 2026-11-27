export type TipoMaterial =
  | "parcial"
  | "final"
  | "apunte"
  | "guia_resuelta"
  | "resumen"
  | "tp"
  | "presentacion"
  | "otro";

export const TIPOS_MATERIAL: Record<TipoMaterial, string> = {
  parcial: "Parcial",
  final: "Final",
  apunte: "Apunte",
  guia_resuelta: "Guía resuelta",
  resumen: "Resumen",
  tp: "TP",
  presentacion: "Presentación",
  otro: "Otro",
};

export type Cuatrimestre = "primero" | "segundo" | "anual";

export const CUATRIMESTRES: Record<Cuatrimestre, string> = {
  primero: "Primer cuatrimestre",
  segundo: "Segundo cuatrimestre",
  anual: "Anual",
};

export type EstadoRevision = "pendiente" | "aprobado" | "rechazado";

export const ESTADOS: Record<EstadoRevision, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

/** Cookie con la última carrera abierta ("Carreras" te lleva directo ahí). */
export const COOKIE_CARRERA = "carrera";

export const MOTIVOS_REPORTE = {
  materia_incorrecta: "Está en la materia o el profesor equivocado",
  ilegible: "No se ve o está incompleto",
  duplicado: "Está repetido",
  inapropiado: "Contenido inapropiado o con datos personales",
  otro: "Otro",
} as const;
export type MotivoReporte = keyof typeof MOTIVOS_REPORTE;

/** Extensiones bloqueadas por seguridad (ejecutables). Todo lo demás se acepta. */
export const EXTENSIONES_BLOQUEADAS = [
  "exe", "msi", "bat", "cmd", "com", "scr", "ps1", "vbs", "jar", "app", "dmg", "apk", "sh",
];

export function extension(nombre: string) {
  const i = nombre.lastIndexOf(".");
  return i === -1 ? "" : nombre.slice(i + 1).toLowerCase();
}

export function formatearTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Adivina el tipo de material por el nombre del archivo (se puede corregir a mano). */
export function detectarTipo(nombreArchivo: string): TipoMaterial {
  const n = normalizar(nombreArchivo);
  const ext = extension(n);
  if (["ppt", "pptx", "odp", "key"].includes(ext) || /presentacion|diapositiva|canva/.test(n)) return "presentacion";
  if (/\bfinal(es)?\b/.test(n)) return "final";
  if (/parcial|recuperatorio|examen/.test(n)) return "parcial";
  if (/\btps?\b|trabajo practico|\btp\s?\d/.test(n)) return "tp";
  if (/guia|ejercicio|practica/.test(n)) return "guia_resuelta";
  if (/resumen|sintesis/.test(n)) return "resumen";
  if (/apunte|teoria|nota|clase|libro|tabla/.test(n)) return "apunte";
  return "otro";
}

/** Año que aparece en el nombre del archivo (ej. "Final 2024.jpg" → "2024"). */
export function detectarAnioCursada(nombre: string) {
  return nombre.match(/\b(199\d|20\d{2})\b/)?.[1] ?? "";
}

export type TipoVistaPrevia ="pdf" | "imagen" | "texto" | null;

export function tipoVistaPrevia(nombre: string): TipoVistaPrevia {
  const ext = extension(nombre);
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "imagen";
  if (["txt", "md", "csv", "c", "cpp", "h", "py", "java", "js", "ts", "sql", "json"].includes(ext)) return "texto";
  return null;
}

/** Content-Type a forzar en la vista previa (evita que un .svg o .html ejecute scripts). */
export function contentTypeVistaPrevia(nombre: string): string | null {
  const tipo = tipoVistaPrevia(nombre);
  if (tipo === "pdf") return "application/pdf";
  if (tipo === "texto") return "text/plain; charset=utf-8";
  if (tipo === "imagen") {
    const ext = extension(nombre);
    if (ext === "svg") return "image/svg+xml";
    return `image/${ext === "jpg" ? "jpeg" : ext}`;
  }
  return null;
}
