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
    <main className="relative flex min-h-screen items-center justify-center bg-suave px-4 dark:bg-fondo">
      <div className="absolute right-4 top-4">
        <BotonTema />
      </div>
      <div className="animate-entrada tarjeta w-full max-w-sm p-8 text-center shadow-[0_12px_40px_-20px_rgb(0_0_0/0.2)]">
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
