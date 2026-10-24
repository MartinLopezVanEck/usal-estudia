import Link from "next/link";
import { BotonGoogle } from "./boton-google";

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
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-borde bg-superficie p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Usal Estudia</h1>
        <p className="mt-2 text-sm text-tenue">
          Parciales, apuntes y guías de la USAL, compartidos por alumnos.
        </p>
        {error && (
          <p className="mt-6 rounded-lg bg-peligro/10 px-3 py-2 text-sm text-peligro">
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
