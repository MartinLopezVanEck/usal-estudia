import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Donacion } from "@/components/donacion";

async function contar() {
  const db = createAdminClient();
  const [archivos, materias, profesores] = await Promise.all(
    (["archivos", "materias", "profesores"] as const).map((t) =>
      db.from(t).select("id", { count: "exact", head: true }).eq("estado", "aprobado"),
    ),
  );
  return {
    archivos: archivos.count ?? 0,
    materias: materias.count ?? 0,
    profesores: profesores.count ?? 0,
  };
}

const PASOS = [
  {
    titulo: "Ingresá con tu cuenta @usal",
    texto: "Es solo para alumnos de la USAL. Entrás con Google, sin crear usuario ni contraseña.",
  },
  {
    titulo: "Buscá tu materia",
    texto: "Navegá por carrera, año y materia, o usá el buscador. Filtrá por profesor y por tipo de material.",
  },
  {
    titulo: "Sumá lo tuyo",
    texto: "Subí parciales, apuntes o resúmenes. Un admin los revisa y quedan disponibles para todos.",
  },
];

const SI = [
  "Parciales, finales y recuperatorios (enunciados o resueltos)",
  "Apuntes, resúmenes y guías resueltas",
  "Trabajos prácticos y presentaciones",
  "Subir de forma anónima si preferís que no aparezca tu nombre",
  "Proponer materias o profesores que falten",
];

const NO = [
  "Material que no tengas derecho a compartir",
  "Contenido ofensivo o que no tenga que ver con la facultad",
  "Datos personales de otras personas (DNI, notas, mails)",
  "Archivos ejecutables o de más de 25 MB",
  "Usarlo como fuente oficial: es material de alumnos, puede tener errores",
];

export default async function PresentacionPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    numeros,
  ] = await Promise.all([supabase.auth.getUser(), contar()]);

  const cta = user ? (
    <Link href="/carreras" className="btn-primario px-6 py-3 text-base">
      Ir a las carreras
    </Link>
  ) : (
    <Link href="/login" className="btn-primario px-6 py-3 text-base">
      Ingresar con mi cuenta @usal
    </Link>
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-borde bg-superficie">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold">Usal Estudia</span>
          <Link href={user ? "/carreras" : "/login"} className="text-sm font-medium text-acento hover:underline">
            {user ? "Entrar" : "Ingresar"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-4 py-12 sm:py-16">
        <section className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Todo el material de la facu,
            <br className="hidden sm:block" /> en un solo lugar
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-tenue">
            Parciales, finales, apuntes y guías resueltas de la USAL, organizados por carrera, materia y
            profesor. Hecho por alumnos, para alumnos.
          </p>
          <div className="mt-8 flex justify-center">{cta}</div>

          <dl className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4">
            {[
              [numeros.archivos, "archivos"],
              [numeros.materias, "materias"],
              [numeros.profesores, "profesores"],
            ].map(([n, etiqueta]) => (
              <div key={etiqueta} className="tarjeta px-2 py-4">
                <dt className="sr-only">{etiqueta}</dt>
                <dd className="text-2xl font-semibold tabular-nums sm:text-3xl">{n}</dd>
                <dd className="text-sm text-tenue">{etiqueta}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Cómo funciona</h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="tarjeta p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-acento/10 font-semibold text-acento">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-medium">{p.titulo}</h3>
                <p className="mt-1 text-sm text-tenue">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="tarjeta p-5">
            <h2 className="font-semibold text-exito">✓ Qué podés compartir</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {SI.map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden className="text-exito">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="tarjeta p-5">
            <h2 className="font-semibold text-peligro">✕ Qué no</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {NO.map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden className="text-peligro">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Donacion />
      </main>

      <footer className="border-t border-borde">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-tenue">
          <span>Usal Estudia no es un sitio oficial de la Universidad del Salvador.</span>
          <span>
            <Link href="/privacidad" className="hover:underline">Privacidad</Link>
            {" · "}
            <Link href="/terminos" className="hover:underline">Términos</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
