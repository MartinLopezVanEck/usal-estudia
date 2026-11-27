/**
 * "Mis materias" se guarda en el navegador (localStorage), sin base de datos.
 * Los cambios se avisan con un evento para que la estrella y la lista se
 * actualicen al instante (también entre pestañas, con el evento "storage").
 */
export type MateriaGuardada = { slug: string; nombre: string };

const CLAVE = "usal-estudia:mis-materias";
const EVENTO = "usal:mis-materias";
const VACIA: MateriaGuardada[] = [];

let ultimoTexto: string | null = null;
let ultimaLista: MateriaGuardada[] = VACIA;

/** Devuelve siempre el mismo array mientras no cambie (lo pide useSyncExternalStore). */
export function leerMisMaterias(): MateriaGuardada[] {
  let texto: string | null = null;
  try {
    texto = localStorage.getItem(CLAVE);
  } catch {
    return VACIA;
  }
  if (texto === ultimoTexto) return ultimaLista;
  ultimoTexto = texto;
  try {
    const datos = JSON.parse(texto ?? "[]");
    ultimaLista = Array.isArray(datos) ? datos : VACIA;
  } catch {
    ultimaLista = VACIA;
  }
  return ultimaLista;
}

export function misMateriasServidor() {
  return VACIA;
}

export function alternarMateria(materia: MateriaGuardada) {
  const actual = leerMisMaterias();
  const nueva = actual.some((m) => m.slug === materia.slug)
    ? actual.filter((m) => m.slug !== materia.slug)
    : [...actual, materia];
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nueva));
  } catch {
    return; // Sin almacenamiento (modo privado): no se puede guardar.
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function suscribirMisMaterias(cambio: () => void) {
  window.addEventListener(EVENTO, cambio);
  window.addEventListener("storage", cambio);
  return () => {
    window.removeEventListener(EVENTO, cambio);
    window.removeEventListener("storage", cambio);
  };
}
