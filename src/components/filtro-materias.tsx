"use client";

import Link from "next/link";
import { useState } from "react";

export type AnioPlan = {
  anio: number;
  cuatrimestres: { clave: string; etiqueta: string; materias: { nombre: string; slug: string }[] }[];
};

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Plan de la carrera con un campo para filtrar materias mientras escribís. */
export function FiltroMaterias({ plan, carrera }: { plan: AnioPlan[]; carrera: string }) {
  const [texto, setTexto] = useState("");
  const q = normalizar(texto);

  const visibles = plan
    .map((a) => ({
      ...a,
      cuatrimestres: a.cuatrimestres
        .map((c) => ({ ...c, materias: c.materias.filter((m) => !q || normalizar(m.nombre).includes(q)) }))
        .filter((c) => c.materias.length > 0),
    }))
    .filter((a) => a.cuatrimestres.length > 0);

  return (
    <div>
      <label className="relative mt-6 block max-w-sm">
        <span className="sr-only">Filtrar materias</span>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Filtrar materias de esta carrera"
          className="input pl-10"
        />
      </label>

      {visibles.length === 0 && (
        <p className="tarjeta mt-6 p-6 text-center text-sm text-tenue">Ninguna materia coincide con «{texto}».</p>
      )}

      <div className="mt-8 space-y-10">
        {visibles.map((a, i) => (
          <section
            key={a.anio}
            id={`anio-${a.anio}`}
            className="escalonado scroll-mt-24"
            style={{ "--i": i * 2 } as React.CSSProperties}
          >
            <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
              {a.anio}° año
              <span aria-hidden className="h-px flex-1 bg-borde" />
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {a.cuatrimestres.map((c) => (
                <div key={c.clave} className="tarjeta p-4">
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-acento">{c.etiqueta}</h3>
                  <ul className="space-y-1">
                    {c.materias.map((m) => (
                      <li key={m.slug}>
                        <Link
                          href={`/materias/${m.slug}?carrera=${carrera}`}
                          className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-acento/10 hover:text-acento"
                        >
                          {m.nombre}
                          <span aria-hidden className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
