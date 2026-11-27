"use client";

import { useState } from "react";

/** Copia el link del archivo (sin filtros) para pasarlo por WhatsApp. */
export function CopiarLink({ id }: { id: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const url = `${location.origin}/archivos/${id}`;
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Compartir cancelado o sin permiso de portapapeles: no hacemos nada.
    }
  }

  return (
    <button type="button" onClick={copiar} className="btn-secundario">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {copiado ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
        )}
      </svg>
      {copiado ? "¡Link copiado!" : "Copiar link"}
    </button>
  );
}
