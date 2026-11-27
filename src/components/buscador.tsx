"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type Sugerencia = { href: string; titulo: string; detalle?: string; grupo: "Materias" | "Archivos" };

/**
 * Buscador del header: muestra materias y archivos mientras escribís.
 * Atajos: "/" o Ctrl+K para enfocarlo, flechas para moverte, Enter para abrir, Esc para cerrar.
 */
export function Buscador() {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [cargando, setCargando] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const idLista = useId();

  // Pedir sugerencias con un pequeño retraso para no consultar en cada tecla.
  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) {
      setSugerencias([]);
      return;
    }
    const control = new AbortController();
    const espera = setTimeout(async () => {
      setCargando(true);
      try {
        const r = await fetch(`/api/sugerencias?q=${encodeURIComponent(texto)}`, { signal: control.signal });
        if (!r.ok) return;
        const datos: { materias: { nombre: string; slug: string }[]; archivos: { id: string; titulo: string; detalle: string }[] } =
          await r.json();
        setSugerencias([
          ...datos.materias.map((m) => ({ href: `/materias/${m.slug}`, titulo: m.nombre, grupo: "Materias" as const })),
          ...datos.archivos.map((a) => ({ href: `/archivos/${a.id}`, titulo: a.titulo, detalle: a.detalle, grupo: "Archivos" as const })),
        ]);
        setActivo(-1);
      } catch {
        // Cancelada porque siguió escribiendo, o sin conexión.
      } finally {
        setCargando(false);
      }
    }, 180);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [q]);

  // Atajos globales para enfocar el buscador.
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      const escribiendo = (e.target as HTMLElement).closest("input, textarea, select, [contenteditable]");
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !escribiendo)) {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  // En la página de búsqueda vacía (ej. desde la barra del celular), enfocar directo.
  useEffect(() => {
    if (ruta === "/buscar" && !params.get("q")) input.current?.focus();
  }, [ruta, params]);

  function ir(href: string) {
    setAbierto(false);
    input.current?.blur();
    router.push(href);
  }

  function teclado(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" && sugerencias.length) {
      e.preventDefault();
      setAbierto(true);
      setActivo((i) => (i + 1) % sugerencias.length);
    } else if (e.key === "ArrowUp" && sugerencias.length) {
      e.preventDefault();
      setActivo((i) => (i <= 0 ? sugerencias.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setAbierto(false);
      input.current?.blur();
    } else if (e.key === "Enter" && activo >= 0 && abierto) {
      e.preventDefault();
      ir(sugerencias[activo].href);
    }
  }

  const mostrar = abierto && q.trim().length >= 2;

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) ir(`/buscar?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label className="relative block">
        <span className="sr-only">Buscar</span>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-expanded={mostrar}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={activo >= 0 ? `${idLista}-${activo}` : undefined}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setAbierto(false)}
          onKeyDown={teclado}
          placeholder="Buscar materia, profesor, parcial..."
          className="input peer rounded-full bg-suave/60 py-2 pl-10 pr-10 focus:bg-superficie"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-borde px-1.5 font-mono text-[11px] text-tenue peer-focus:hidden sm:block">
          /
        </kbd>
      </label>

      {mostrar && (
        <div
          // Evita que el input pierda el foco antes de que el clic llegue al link.
          onMouseDown={(e) => e.preventDefault()}
          className="tarjeta absolute inset-x-0 top-full z-30 mt-2 overflow-hidden shadow-[0_16px_40px_-16px_rgb(0_0_0/0.25)]"
        >
          <ul id={idLista} role="listbox" className="max-h-[60vh] overflow-y-auto py-1.5">
            {sugerencias.map((s, i) => (
              <li key={s.href} role="presentation">
                {(i === 0 || sugerencias[i - 1].grupo !== s.grupo) && (
                  <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-tenue">{s.grupo}</p>
                )}
                <button
                  type="button"
                  id={`${idLista}-${i}`}
                  role="option"
                  aria-selected={i === activo}
                  onClick={() => ir(s.href)}
                  onMouseEnter={() => setActivo(i)}
                  className={`flex w-full flex-col px-4 py-2 text-left text-sm ${i === activo ? "bg-suave" : ""}`}
                >
                  <span className="truncate font-medium">{s.titulo}</span>
                  {s.detalle && <span className="truncate text-xs text-tenue">{s.detalle}</span>}
                </button>
              </li>
            ))}
            {!cargando && sugerencias.length === 0 && (
              <li className="px-4 py-3 text-sm text-tenue">Sin sugerencias. Apretá Enter para buscar en todo.</li>
            )}
            {sugerencias.length > 0 && (
              <li role="presentation" className="mt-1 border-t border-borde">
                <button type="submit" className="w-full px-4 py-2.5 text-left text-sm text-acento hover:bg-suave">
                  Ver todos los resultados para «{q.trim()}» →
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </form>
  );
}
