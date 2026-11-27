import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Donacion } from "@/components/donacion";
import { BotonTema } from "@/components/boton-tema";
import { Logo } from "@/components/logo";

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
    icono: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
    titulo: "Ingresá con tu cuenta @usal",
    texto: "Es solo para alumnos de la USAL. Entrás con Google, sin crear usuario ni contraseña.",
  },
  {
    icono: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    titulo: "Buscá tu materia",
    texto: "Navegá por carrera, año y materia, o usá el buscador. Filtrá por profesor y por tipo de material.",
  },
  {
    icono: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
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

  const cta = (
    <Link href={user ? "/carreras" : "/login"} className="btn-primario px-6 py-3 text-base">
      {user ? "Ir a las carreras" : "Ingresar con mi cuenta @usal"}
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-borde/80 bg-superficie/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <BotonTema />
            <Link href={user ? "/carreras" : "/login"} className="btn-secundario px-3.5 py-1.5">
              {user ? "Entrar" : "Ingresar"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-20 px-4 py-14 sm:py-20">
        <section className="relative isolate text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 -z-10 mx-auto h-72 max-w-2xl rounded-full bg-acento/20 blur-3xl"
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-acento/25 bg-acento/10 px-3 py-1 text-xs font-semibold text-acento">
            <span className="h-1.5 w-1.5 rounded-full bg-acento" />
            Hecho por alumnos, para alumnos
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Todo el material de la facu,
            <br className="hidden sm:block" />{" "}
            <span className="bg-linear-to-r from-acento to-acento-fuerte bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-tenue">
            Parciales, finales, apuntes y guías resueltas de la USAL, organizados por carrera, materia y
            profesor.
          </p>
          <div className="mt-9 flex justify-center">{cta}</div>

          <dl className="mx-auto mt-14 grid max-w-xl grid-cols-3 gap-3 sm:gap-4">
            {[
              [numeros.archivos, "archivos"],
              [numeros.materias, "materias"],
              [numeros.profesores, "profesores"],
            ].map(([n, etiqueta]) => (
              <div key={etiqueta} className="tarjeta px-2 py-5">
                <dt className="sr-only">{etiqueta}</dt>
                <dd className="font-display text-2xl font-bold tabular-nums text-acento sm:text-4xl">{n}</dd>
                <dd className="mt-1 text-sm text-tenue">{etiqueta}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Cómo funciona</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="tarjeta relative p-6">
                <span className="absolute right-5 top-4 font-display text-4xl font-bold text-borde">
                  {i + 1}
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-acento/10 text-acento">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={p.icono} />
                  </svg>
                </span>
                <h3 className="mt-4 font-semibold">{p.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-tenue">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {[
            { titulo: "Qué podés compartir", items: SI, color: "text-exito", fondo: "bg-exito/10", icono: "M20 6 9 17l-5-5" },
            { titulo: "Qué no", items: NO, color: "text-peligro", fondo: "bg-peligro/10", icono: "M18 6 6 18M6 6l12 12" },
          ].map((bloque) => (
            <div key={bloque.titulo} className="tarjeta p-6">
              <h2 className="flex items-center gap-2.5 text-lg font-bold">
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${bloque.fondo} ${bloque.color}`}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={bloque.icono} />
                  </svg>
                </span>
                {bloque.titulo}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {bloque.items.map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span aria-hidden className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current ${bloque.color}`} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <Donacion />
      </main>

      <footer className="border-t border-borde">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-8 text-xs text-tenue">
          <span>Usal Estudia no es un sitio oficial de la Universidad del Salvador.</span>
          <span>
            <Link href="/privacidad" className="hover:text-texto">Privacidad</Link>
            {" · "}
            <Link href="/terminos" className="hover:text-texto">Términos</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
