import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const SECCIONES = [
  { href: "/admin", label: "Pendientes" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/catalogo", label: "Carreras y materias" },
  { href: "/admin/profesores", label: "Profesores" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-borde">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm hover:border-borde"
          >
            {s.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
