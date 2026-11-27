import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="font-display text-7xl font-bold text-acento/30">404</span>
      <h1 className="text-2xl font-bold">No encontramos esa página</h1>
      <p className="text-sm text-tenue">Puede que se haya movido, o que todavía esté pendiente de aprobación.</p>
      <Link href="/" className="btn-primario">Volver al inicio</Link>
    </main>
  );
}
