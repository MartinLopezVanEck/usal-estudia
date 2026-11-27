"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Link del menú que se marca cuando estás en esa sección. */
export function NavLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const ruta = usePathname();
  const activo = ruta === href || ruta.startsWith(`${href}/`) || (href === "/carreras" && /^\/(materias|archivos)/.test(ruta));

  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`relative rounded-full px-3.5 py-1.5 transition ${className} ${
        activo ? "bg-acento/12 text-acento" : "text-tenue hover:bg-suave hover:text-texto"
      }`}
    >
      {children}
    </Link>
  );
}
