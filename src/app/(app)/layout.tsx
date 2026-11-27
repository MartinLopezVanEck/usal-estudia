import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Buscador } from "@/components/buscador";
import { BotonTema } from "@/components/boton-tema";
import { Logo } from "@/components/logo";

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
      <header className="sticky top-0 z-20 border-b border-borde/80 bg-superficie/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/" aria-label="Usal Estudia, inicio">
            <Logo />
          </Link>
          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <Suspense>
              <Buscador />
            </Suspense>
          </div>
          <nav className="ml-auto flex items-center gap-1 text-sm font-medium">
            <Link href="/carreras" className="rounded-lg px-3 py-1.5 text-tenue transition hover:bg-suave hover:text-texto">
              Carreras
            </Link>
            <Link href="/subir" className="btn-primario px-3 py-1.5">
              Subir
            </Link>
            <Link href="/mis-aportes" className="rounded-lg px-3 py-1.5 text-tenue transition hover:bg-suave hover:text-texto">
              Mis aportes
            </Link>
            {esAdmin && (
              <Link href="/admin" className="relative rounded-lg px-3 py-1.5 text-tenue transition hover:bg-suave hover:text-texto">
                Admin
                {pendientes > 0 && (
                  <span className="ml-1 rounded-full bg-aviso px-1.5 py-0.5 text-xs font-semibold text-acento-texto">
                    {pendientes}
                  </span>
                )}
              </Link>
            )}
            <BotonTema />
            <form action="/auth/salir" method="post">
              <button
                className="rounded-lg px-3 py-1.5 text-tenue transition hover:bg-peligro/10 hover:text-peligro"
                title={perfil.email}
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
