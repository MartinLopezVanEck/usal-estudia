"use client";

import { useSyncExternalStore } from "react";
import { alternarMateria, leerMisMaterias, misMateriasServidor, suscribirMisMaterias } from "@/lib/mis-materias";

/** Estrella para agregar o quitar la materia de "Mis materias" (se guarda en este navegador). */
export function BotonFijar({ slug, nombre }: { slug: string; nombre: string }) {
  const lista = useSyncExternalStore(suscribirMisMaterias, leerMisMaterias, misMateriasServidor);
  const fijada = lista.some((m) => m.slug === slug);

  return (
    <button
      type="button"
      onClick={() => alternarMateria({ slug, nombre })}
      aria-pressed={fijada}
      title={fijada ? "Quitar de Mis materias" : "Agregar a Mis materias"}
      className={`btn border ${
        fijada ? "border-acento bg-acento/10 text-acento" : "border-borde bg-superficie hover:bg-suave"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill={fijada ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
      </svg>
      {fijada ? "En Mis materias" : "Agregar a Mis materias"}
    </button>
  );
}
