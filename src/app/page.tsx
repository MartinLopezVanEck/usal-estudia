import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Donacion } from "@/components/donacion";
import { BotonTema } from "@/components/boton-tema";
import { Logo } from "@/components/logo";
import { Contador } from "@/components/contador";

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

const MARQUESINA = [
  "Parciales",
  "Finales",
  "Apuntes",
  "Guías resueltas",
  "Resúmenes",
  "Trabajos prácticos",
  "Recuperatorios",
  "Presentaciones",
];

/** Tarjetas de ejemplo que flotan al lado del título (decorativas). */
const EJEMPLOS = [
  { ext: "pdf", titulo: "Parcial 1 resuelto", meta: "Análisis Matemático I · 2025", tipo: "Parcial", pos: "left-0 top-6 -rotate-6", flotar: "0s" },
  { ext: "docx", titulo: "Resumen completo", meta: "Sistemas Operativos · 2024", tipo: "Resumen", pos: "right-0 top-36 rotate-3", flotar: "-2.5s" },
  { ext: "pdf", titulo: "Final con respuestas", meta: "Física II · 2025", tipo: "Final", pos: "left-8 bottom-2 -rotate-2", flotar: "-5s" },
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

const Flecha = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default async function PresentacionPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    numeros,
  ] = await Promise.all([supabase.auth.getUser(), contar()]);

  const destino = user ? "/carreras" : "/login";

  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-20 px-3 pt-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-borde/80 bg-superficie/75 px-4 py-2.5 shadow-lg shadow-black/[0.03] backdrop-blur-xl">
          <Logo />
          <div className="flex items-center gap-1.5">
            <BotonTema />
            <Link href={destino} className="btn-primario rounded-full px-4 py-1.5">
              {user ? "Entrar" : "Ingresar"}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative isolate -mt-20 pt-20">
          <div aria-hidden className="fondo-puntos absolute inset-0 -z-10" />
          <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-[560px] w-[min(900px,100%)] -translate-x-1/2">
            <div className="animate-aurora absolute left-0 top-10 h-80 w-80 rounded-full bg-acento/30 blur-[90px]" />
            <div className="animate-aurora absolute right-0 top-28 h-72 w-72 rounded-full bg-brillo/25 blur-[90px] [animation-delay:-8s]" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-16 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:pb-24">
            <div className="text-center lg:text-left">
              <span className="animate-entrada inline-flex items-center gap-2 rounded-full border border-acento/25 bg-superficie/70 px-3.5 py-1.5 text-xs font-semibold text-acento backdrop-blur">
                <span className="animate-latido h-2 w-2 rounded-full bg-acento" />
                Hecho por alumnos, para alumnos
              </span>
              <h1 className="animate-entrada mt-7 text-5xl font-extrabold leading-[0.95] tracking-tighter [animation-delay:80ms] sm:text-7xl">
                Todo el material de la facu,{" "}
                <span className="texto-degradado font-serif text-[1.08em] font-normal italic tracking-tight">
                  en un solo lugar.
                </span>
              </h1>
              <p className="animate-entrada mx-auto mt-6 max-w-xl text-lg leading-relaxed text-tenue [animation-delay:160ms] lg:mx-0">
                Parciales, finales, apuntes y guías resueltas de la USAL, organizados por carrera, materia y
                profesor.
              </p>
              <div className="animate-entrada mt-9 flex flex-wrap items-center justify-center gap-3 [animation-delay:240ms] lg:justify-start">
                <Link href={destino} className="btn-primario group rounded-full px-6 py-3.5 text-base">
                  {user ? "Ir a las carreras" : "Ingresar con mi cuenta @usal"}
                  <Flecha className="transition group-hover:translate-x-1" />
                </Link>
                <a href="#como-funciona" className="btn rounded-full px-5 py-3.5 text-base text-tenue hover:text-texto">
                  Cómo funciona
                </a>
              </div>

              <dl className="animate-entrada mt-12 flex justify-center gap-8 [animation-delay:320ms] sm:gap-12 lg:justify-start">
                {(
                  [
                    [numeros.archivos, "archivos"],
                    [numeros.materias, "materias"],
                    [numeros.profesores, "profesores"],
                  ] as const
                ).map(([n, etiqueta]) => (
                  <div key={etiqueta}>
                    <dt className="sr-only">{etiqueta}</dt>
                    <dd className="font-display text-3xl font-extrabold tabular-nums tracking-tight sm:text-4xl">
                      <Contador valor={n} />
                    </dd>
                    <dd className="text-sm text-tenue">{etiqueta}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Tarjetas flotantes de ejemplo */}
            <div aria-hidden className="relative mx-auto hidden h-[400px] w-full max-w-md select-none sm:block">
              <div className="absolute inset-10 rounded-full bg-acento/15 blur-3xl" />
              {EJEMPLOS.map((e, i) => (
                <div
                  key={e.titulo}
                  className={`animate-entrada absolute w-72 ${e.pos}`}
                  style={{ animationDelay: `${300 + i * 150}ms` }}
                >
                  <div
                    className="animate-flotar tarjeta flex items-center gap-3.5 p-4 shadow-2xl shadow-acento/10"
                    style={{ animationDelay: e.flotar }}
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-linear-to-br from-acento to-acento-fuerte font-mono text-[10px] font-bold uppercase text-white">
                      {e.ext}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{e.titulo}</p>
                      <p className="truncate text-xs text-tenue">{e.meta}</p>
                      <span className="mt-1.5 inline-block rounded-full bg-acento/10 px-2 py-0.5 text-[10px] font-semibold text-acento">
                        {e.tipo}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cinta con los tipos de material */}
          <div className="mascara-lados overflow-hidden border-y border-borde bg-superficie/50 py-5 backdrop-blur">
            <div className="animate-marquesina flex w-max">
              {[...MARQUESINA, ...MARQUESINA].map((t, i) => (
                <span
                  key={i}
                  aria-hidden={i >= MARQUESINA.length}
                  className="flex items-center gap-10 pr-10 font-display text-2xl font-bold tracking-tight text-tenue/70 sm:text-3xl"
                >
                  {t}
                  <span className="text-acento">✦</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-24 px-4 py-24">
          {/* ---------- Cómo funciona ---------- */}
          <section id="como-funciona" className="scroll-mt-24">
            <div className="revelar max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-acento">Cómo funciona</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tighter sm:text-5xl">
                Tres pasos y estás{" "}
                <span className="font-serif font-normal italic text-acento">estudiando.</span>
              </h2>
            </div>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {PASOS.map((p, i) => (
                <li key={p.titulo} className="revelar tarjeta spotlight group overflow-hidden p-7">
                  <span className="pointer-events-none absolute -top-6 right-2 font-serif text-[9rem] italic leading-none text-acento/[0.08] transition duration-500 group-hover:text-acento/20">
                    {i + 1}
                  </span>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-acento/10 text-acento transition duration-300 group-hover:scale-110 group-hover:bg-acento group-hover:text-acento-texto">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={p.icono} />
                    </svg>
                  </span>
                  <h3 className="mt-6 text-lg font-bold">{p.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-tenue">{p.texto}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ---------- Reglas ---------- */}
          <section className="grid gap-4 md:grid-cols-2">
            {[
              { titulo: "Qué podés compartir", items: SI, color: "text-exito", fondo: "bg-exito/10", icono: "M20 6 9 17l-5-5" },
              { titulo: "Qué no", items: NO, color: "text-peligro", fondo: "bg-peligro/10", icono: "M18 6 6 18M6 6l12 12" },
            ].map((bloque) => (
              <div key={bloque.titulo} className="revelar tarjeta spotlight p-7">
                <h2 className="flex items-center gap-3 text-xl font-bold">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${bloque.fondo} ${bloque.color}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={bloque.icono} />
                    </svg>
                  </span>
                  {bloque.titulo}
                </h2>
                <ul className="mt-5 space-y-3 text-sm">
                  {bloque.items.map((t) => (
                    <li key={t} className="flex gap-3">
                      <span aria-hidden className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current ${bloque.color}`} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <div className="revelar">
            <Donacion />
          </div>

          {/* ---------- Cierre ---------- */}
          <section className="revelar relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-acento-fuerte via-acento to-acento-fuerte px-6 py-16 text-center text-white dark:from-[#06382a] dark:via-[#0a6b48] dark:to-[#06382a]">
            <div aria-hidden className="absolute -left-20 -top-20 -z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div aria-hidden className="absolute -bottom-24 -right-10 -z-10 h-72 w-72 rounded-full bg-brillo/30 blur-3xl" />
            <h2 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
              El próximo parcial, <span className="font-serif font-normal italic">más tranqui.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/80">
              Entrá, buscá tu materia y fijate qué tomaron otros años.
            </p>
            <Link
              href={destino}
              className="btn group mt-8 rounded-full bg-white px-6 py-3.5 text-base text-[#08473b] shadow-xl shadow-black/20 hover:-translate-y-px hover:bg-white/90"
            >
              {user ? "Ir a las carreras" : "Empezar ahora"}
              <Flecha className="transition group-hover:translate-x-1" />
            </Link>
          </section>
        </div>
      </main>

      <footer className="border-t border-borde">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs text-tenue">
          <Logo />
          <span>Usal Estudia no es un sitio oficial de la Universidad del Salvador.</span>
          <span>
            <Link href="/privacidad" className="transition hover:text-acento">Privacidad</Link>
            {" · "}
            <Link href="/terminos" className="transition hover:text-acento">Términos</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
