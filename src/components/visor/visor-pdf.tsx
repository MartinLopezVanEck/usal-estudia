"use client";

import { useSyncExternalStore } from "react";

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
 */
export function VisorPdf({ url, titulo }: { url: string; titulo: string }) {
  const grande = useSyncExternalStore(
    suscribir,
    () => matchMedia(CONSULTA).matches,
    () => null,
  );

  if (grande === null) return <div className="tarjeta h-[80vh] animate-pulse bg-suave" />;

  if (grande) return <iframe src={url} title={titulo} className="tarjeta h-[80vh] w-full" />;

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
