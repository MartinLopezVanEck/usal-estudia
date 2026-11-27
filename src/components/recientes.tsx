"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * "Vistos recientemente": se guarda solo en este navegador (localStorage).
 * Si el almacenamiento no está disponible, simplemente no se muestra.
 */
type Visita = { href: string; titulo: string; detalle: string; tipo: "archivo" | "materia" };

const CLAVE = "usal-estudia:recientes";
const MAXIMO = 8;

function leer(): Visita[] {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

/** Anota la página actual en el historial. No dibuja nada. */
export function RegistrarVisita(visita: Visita) {
  const { href, titulo, detalle, tipo } = visita;
  useEffect(() => {
    try {
      const resto = leer().filter((v) => v.href !== href);
      localStorage.setItem(CLAVE, JSON.stringify([{ href, titulo, detalle, tipo }, ...resto].slice(0, MAXIMO)));
    } catch {
      // Sin almacenamiento (modo privado, bloqueado): no se guarda.
    }
  }, [href, titulo, detalle, tipo]);
  return null;
}

export function Recientes() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  useEffect(() => setVisitas(leer()), []);

  if (visitas.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-tenue">Vistos recientemente</h2>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(CLAVE);
            } catch {}
            setVisitas([]);
          }}
          className="text-xs text-tenue hover:text-texto"
        >
          Borrar historial
        </button>
      </div>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:thin]">
        {visitas.map((v, i) => (
          <li key={v.href} className="escalonado shrink-0" style={{ "--i": i } as React.CSSProperties}>
            <Link href={v.href} className="tarjeta-link flex w-56 items-center gap-3 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-suave text-tenue">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {v.tipo === "archivo" ? (
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />
                  ) : (
                    <path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5a2.5 2.5 0 0 0 0 5H20" />
                  )}
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{v.titulo}</span>
                <span className="block truncate text-xs text-tenue">{v.detalle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
