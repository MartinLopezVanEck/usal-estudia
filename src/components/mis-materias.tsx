"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { leerMisMaterias, misMateriasServidor, suscribirMisMaterias } from "@/lib/mis-materias";

/** Materias fijadas con la estrella. No muestra nada si no hay ninguna. */
export function MisMaterias() {
  const materias = useSyncExternalStore(suscribirMisMaterias, leerMisMaterias, misMateriasServidor);
  if (materias.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-tenue">Mis materias</h2>
      <ul className="flex flex-wrap gap-2">
        {materias.map((m, i) => (
          <li key={m.slug} className="escalonado" style={{ "--i": i } as React.CSSProperties}>
            <Link
              href={`/materias/${m.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-borde bg-superficie px-4 py-2 text-sm font-medium transition hover:border-acento hover:text-acento"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-acento" fill="currentColor" aria-hidden>
                <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
              </svg>
              {m.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
