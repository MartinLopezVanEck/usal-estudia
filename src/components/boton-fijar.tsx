"use client";

import { useOptimistic, useState, useTransition } from "react";
import { alternarFijada } from "@/app/(app)/acciones";

/** Estrella para agregar o quitar la materia de "Mis materias". */
export function BotonFijar({ materiaId, fijada }: { materiaId: string; fijada: boolean }) {
  const [estado, setEstado] = useState(fijada);
  const [optimista, aplicar] = useOptimistic(estado, (_: boolean, nuevo: boolean) => nuevo);
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  function alternar() {
    const nuevo = !optimista;
    setError("");
    startTransition(async () => {
      aplicar(nuevo);
      const r = await alternarFijada(materiaId, nuevo);
      if (r.ok) setEstado(nuevo);
      else setError(r.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={alternar}
        aria-pressed={optimista}
        title={optimista ? "Quitar de Mis materias" : "Agregar a Mis materias"}
        className={`btn border ${
          optimista ? "border-acento bg-acento/10 text-acento" : "border-borde bg-superficie hover:bg-suave"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={optimista ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
        </svg>
        {optimista ? "En Mis materias" : "Agregar a Mis materias"}
      </button>
      {error && <span className="mt-1 text-xs text-peligro">{error}</span>}
    </span>
  );
}
