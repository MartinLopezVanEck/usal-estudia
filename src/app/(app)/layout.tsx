import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Buscador } from "@/components/buscador";
import { BotonTema } from "@/components/boton-tema";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-links";

async function contarPendientes() {
  const db = createAdminClient();
  const tablas = ["archivos", "carreras", "materias", "profesores"] as const;
  const conteos = await Promise.all(
    tablas.map((t) =>
      db.from(t).select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    ),
  );
  return conteos.reduce((total, { count }) => total + (count ?? 0), 0);
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireUser();
  const esAdmin = perfil.rol === "admin";
  const pendientes = esAdmin ? await contarPendientes() : 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-borde bg-fondo/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <Link href="/" aria-label="Usal Estudia, inicio" className="transition hover:opacity-80">
            <Logo />
          </Link>
          <div className="order-last w-full sm:order-none sm:w-auto sm:max-w-md sm:flex-1">
            <Suspense>
              <Buscador />
            </Suspense>
          </div>
          <nav className="ml-auto flex items-center gap-1 text-sm font-medium">
            <NavLink href="/carreras">Carreras</NavLink>
            <NavLink href="/mis-aportes">Mis aportes</NavLink>
            {esAdmin && (
              <NavLink href="/admin">
                Admin
                {pendientes > 0 && (
                  <span className="ml-1.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-aviso px-1 text-[11px] font-bold text-acento-texto">
                    {pendientes}
                  </span>
                )}
              </NavLink>
            )}
            <Link href="/subir" className="btn-primario ml-1 rounded-full px-4 py-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Subir
            </Link>
            <BotonTema />
            <form action="/auth/salir" method="post">
              <button
                className="rounded-full p-2 text-tenue transition hover:bg-peligro/10 hover:text-peligro"
                title={`Salir (${perfil.email})`}
                aria-label="Salir"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
