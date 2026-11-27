"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const CONSULTA = "(min-width: 768px)";

function suscribir(cambio: () => void) {
  const mq = matchMedia(CONSULTA);
  mq.addEventListener("change", cambio);
  return () => mq.removeEventListener("change", cambio);
}

/**
 * En compu muestra el PDF embebido. En el celular (donde muchas veces se ve solo
 * la primera hoja) muestra un botón grande para abrirlo con el visor del teléfono,
 * y así tampoco se descarga el PDF dos veces.
 *
 * `siguiente`: cuando este PDF terminó de cargar, se precarga el próximo de la
 * lista en segundo plano, así la flecha → lo abre al instante.
 */
export function VisorPdf({ url, titulo, siguiente }: { url: string; titulo: string; siguiente?: string }) {
  const grande = useSyncExternalStore(
    suscribir,
    () => matchMedia(CONSULTA).matches,
    () => null,
  );
  // (La página lo monta con key={url}, así al cambiar de archivo arranca de cero.)
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    if (!cargado || !siguiente || !grande) return;
    // Sin precarga si la conexión es lenta o el usuario pidió ahorrar datos.
    const conexion = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conexion?.saveData || /2g/.test(conexion?.effectiveType ?? "")) return;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = siguiente;
    const id = (window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500)))(() =>
      document.head.appendChild(link),
    );
    return () => {
      (window.cancelIdleCallback ?? clearTimeout)(id as number);
      link.remove();
    };
  }, [cargado, siguiente, grande]);

  if (grande === null) return <div className="tarjeta h-[80vh] animate-pulse bg-suave" />;

  if (grande) {
    return (
      <div className="relative">
        {!cargado && (
          <div className="tarjeta absolute inset-0 grid place-items-center bg-suave">
            <span className="flex items-center gap-2 text-sm text-tenue">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-borde border-t-acento" />
              Cargando PDF…
            </span>
          </div>
        )}
        <iframe
          key={url}
          src={url}
          title={titulo}
          onLoad={() => setCargado(true)}
          className="tarjeta h-[80vh] w-full"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="tarjeta-link flex flex-col items-center gap-3 px-6 py-12 text-center"
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-acento/10 font-mono text-xs font-bold uppercase text-acento">
        pdf
      </span>
      <span className="text-lg font-semibold">Abrir PDF</span>
      <span className="text-sm text-tenue">Se abre con el visor de tu celular, con todas las páginas.</span>
    </a>
  );
}
