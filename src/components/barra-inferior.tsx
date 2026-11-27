"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONOS = {
  carreras: "M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5a2.5 2.5 0 0 0 0 5H20",
  buscar: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  subir: "M12 5v14M5 12h14",
  aportes: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4",
  admin: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z",
};

/** Navegación fija abajo en el celular (en pantallas grandes está en el header). */
export function BarraInferior({ esAdmin, pendientes }: { esAdmin: boolean; pendientes: number }) {
  const ruta = usePathname();
  const items = [
    { href: "/carreras", label: "Carreras", icono: ICONOS.carreras, activo: /^\/(carreras|materias|archivos)/.test(ruta) },
    { href: "/buscar", label: "Buscar", icono: ICONOS.buscar, activo: ruta.startsWith("/buscar") },
    { href: "/subir", label: "Subir", icono: ICONOS.subir, activo: ruta.startsWith("/subir"), destacado: true },
    { href: "/mis-aportes", label: "Aportes", icono: ICONOS.aportes, activo: ruta.startsWith("/mis-aportes") },
    ...(esAdmin ? [{ href: "/admin", label: "Admin", icono: ICONOS.admin, activo: ruta.startsWith("/admin") }] : []),
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-fondo/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg sm:hidden"
    >
      <ul className="flex">
        {items.map((it) => (
          <li key={it.href} className="flex-1">
            <Link
              href={it.href}
              aria-current={it.activo ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
                it.activo ? "text-acento" : "text-tenue"
              }`}
            >
              <span
                className={`grid h-7 w-12 place-items-center rounded-full transition ${
                  "destacado" in it && it.destacado ? "bg-acento text-acento-texto" : it.activo ? "bg-acento/10" : ""
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={it.icono} />
                </svg>
              </span>
              {it.label}
              {it.href === "/admin" && pendientes > 0 && (
                <span className="absolute right-[calc(50%-22px)] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-aviso px-1 text-[10px] font-bold text-acento-texto">
                  {pendientes}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
