/** Pasa a minúsculas, saca acentos y caracteres que rompen el filtro de Supabase. */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[%_,()]/g, " ");
}

/** Palabras de búsqueda (máximo `limite`). Cada una tiene que aparecer en el resultado. */
export function palabras(q: string, limite = 8) {
  return normalizar(q).split(/\s+/).filter(Boolean).slice(0, limite);
}

export function coincide(texto: string, buscadas: string[]) {
  const n = normalizar(texto);
  return buscadas.every((p) => n.includes(p));
}
