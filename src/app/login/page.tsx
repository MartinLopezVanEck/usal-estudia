import Link from "next/link";
import { BotonGoogle } from "./boton-google";
import { BotonTema } from "@/components/boton-tema";
import { Marca } from "@/components/logo";

const ERRORES: Record<string, string> = {
  dominio: "Solo se puede ingresar con una cuenta @usal.edu.ar o una cuenta autorizada por un admin.",
  auth: "No se pudo iniciar sesión. Probá de nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center px-4">
      <div
        aria-hidden
        className="fondo-puntos absolute inset-0 -z-10"
      />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-96 w-[min(640px,100%)] -translate-x-1/2 -translate-y-1/2">
        <div className="animate-aurora absolute left-0 top-0 h-72 w-72 rounded-full bg-acento/30 blur-[90px]" />
        <div className="animate-aurora absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brillo/25 blur-[90px] [animation-delay:-8s]" />
      </div>
      <div className="absolute right-4 top-4">
        <BotonTema />
      </div>
      <div className="animate-entrada tarjeta w-full max-w-sm bg-superficie/80 p-8 text-center shadow-2xl shadow-acento/10 backdrop-blur-xl">
        <Link href="/" aria-label="Volver al inicio" className="mx-auto mb-5 block w-fit">
          <Marca className="h-14 w-14" />
        </Link>
        <h1 className="text-2xl font-bold">
          Usal <span className="text-acento">Estudia</span>
        </h1>
        <p className="mt-2 text-sm text-tenue">
          Parciales, apuntes y guías de la USAL, compartidos por alumnos.
        </p>
        {error && (
          <p className="mt-6 rounded-xl bg-peligro/10 px-3 py-2 text-sm text-peligro">
            {ERRORES[error] ?? ERRORES.auth}
          </p>
        )}
        <div className="mt-6">
          <BotonGoogle next={next} />
        </div>
        <p className="mt-4 text-xs text-tenue">Ingresá con tu cuenta @usal.edu.ar</p>
        <p className="mt-6 border-t border-borde pt-4 text-xs text-tenue">
          <Link href="/privacidad" className="hover:underline">Privacidad</Link>
          {" · "}
          <Link href="/terminos" className="hover:underline">Términos</Link>
        </p>
      </div>
    </main>
  );
}
