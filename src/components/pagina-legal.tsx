import Link from "next/link";

export function PaginaLegal({
  titulo,
  actualizado,
  children,
}: {
  titulo: string;
  actualizado: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-tenue hover:text-texto">
        ← Usal Estudia
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{titulo}</h1>
      <p className="mt-1 text-sm text-tenue">Última actualización: {actualizado}</p>
      <div className="mt-6 space-y-4 leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
        {children}
      </div>
    </main>
  );
}

export function Contacto() {
  const email = process.env.NEXT_PUBLIC_EMAIL_CONTACTO;
  return email ? (
    <a href={`mailto:${email}`} className="text-acento hover:underline">{email}</a>
  ) : (
    <>los administradores del sitio</>
  );
}
