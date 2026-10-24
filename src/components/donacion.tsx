"use client";

import { useState } from "react";

/**
 * Bloque de donación. Se configura con variables de entorno:
 * NEXT_PUBLIC_DONACION_URL (link de pago de Mercado Pago) y/o
 * NEXT_PUBLIC_DONACION_ALIAS (alias para transferir).
 * Si no hay ninguna, no se muestra.
 */
export function Donacion() {
  const url = process.env.NEXT_PUBLIC_DONACION_URL;
  const alias = process.env.NEXT_PUBLIC_DONACION_ALIAS;
  const [copiado, setCopiado] = useState(false);

  if (!url && !alias) return null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(alias!);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el alias igual queda a la vista.
    }
  }

  return (
    <section className="tarjeta p-6 sm:p-8">
      <h2 className="text-xl font-semibold">¿Te sirvió? Bancá a los admins</h2>
      <p className="mt-2 max-w-2xl text-tenue">
        La página es gratis y sin publicidad. Mantenerla lleva tiempo: revisar cada aporte, ordenar las
        materias y pagar el almacenamiento cuando crezca. Si te salvó un parcial, podés colaborar con{" "}
        <strong className="text-texto">$1.000</strong>. Es totalmente opcional.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primario">
            Donar $1.000 con Mercado Pago
          </a>
        )}
        {alias && (
          <div className="flex items-center gap-2 rounded-lg border border-borde px-3 py-1.5 text-sm">
            <span className="text-tenue">{url ? "Alias:" : "Transferí al alias"}</span>
            <span className="font-mono font-medium">{alias}</span>
            <button type="button" onClick={copiar} className="text-acento hover:underline">
              {copiado ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
