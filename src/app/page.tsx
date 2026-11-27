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

/** Filas de ejemplo para la vista previa de una materia (decorativa). */
const EJEMPLO = [
  { ext: "pdf", titulo: "Primer parcial resuelto", tipo: "Parcial", meta: "2025 · 1,2 MB" },
  { ext: "pdf", titulo: "Final diciembre", tipo: "Final", meta: "2024 · 860 KB" },
  { ext: "docx", titulo: "Resumen unidades 1 a 4", tipo: "Resumen", meta: "2025 · 2,4 MB" },
  { ext: "pdf", titulo: "Guía de ejercicios 3", tipo: "Guía resuelta", meta: "2024 · 540 KB" },
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

  const destino = user ? "/carreras" : "/login";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-borde bg-fondo/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-1.5">
            <BotonTema />
            <Link href={destino} className="btn-primario rounded-full px-4 py-1.5">
              {user ? "Entrar" : "Ingresar"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* ---------- Hero ---------- */}
        <section className="grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-entrada">
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Todo el material de la facu, en un solo lugar.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-tenue">
              Parciales, finales, apuntes y guías resueltas de la USAL, organizados por carrera, materia y
              profesor. Hecho por alumnos, para alumnos.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={destino} className="btn-primario group rounded-full px-6 py-3 text-base">
                {user ? "Ir a las carreras" : "Ingresar con mi cuenta @usal"}
                <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
              </Link>
              <a href="#como-funciona" className="btn-secundario rounded-full px-6 py-3 text-base">
                Cómo funciona
              </a>
            </div>

            <dl className="mt-12 flex divide-x divide-borde">
              {(
                [
                  [numeros.archivos, "archivos"],
                  [numeros.materias, "materias"],
                  [numeros.profesores, "profesores"],
                ] as const
              ).map(([n, etiqueta]) => (
                <div key={etiqueta} className="px-6 first:pl-0">
                  <dt className="sr-only">{etiqueta}</dt>
                  <dd className="font-display text-3xl font-bold tabular-nums tracking-tight">
                    <Contador valor={n} />
                  </dd>
                  <dd className="text-sm text-tenue">{etiqueta}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Vista previa de cómo se ve una materia */}
          <div aria-hidden className="animate-entrada select-none [animation-delay:150ms]">
            <div className="tarjeta overflow-hidden shadow-[0_24px_60px_-30px_rgb(0_0_0/0.25)]">
              <div className="flex items-center gap-1.5 border-b border-borde bg-suave px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-borde" />
                <span className="h-2.5 w-2.5 rounded-full bg-borde" />
                <span className="h-2.5 w-2.5 rounded-full bg-borde" />
              </div>
              <div className="p-5">
                <p className="text-xs text-tenue">Ingeniería en Informática / 1° año</p>
                <p className="mt-1 font-display text-xl font-bold tracking-tight">Análisis Matemático I</p>
                <div className="mt-4 flex gap-2 text-xs font-medium">
                  <span className="rounded-full bg-acento px-3 py-1 text-acento-texto">Todos</span>
                  <span className="rounded-full border border-borde px-3 py-1">Parcial</span>
                  <span className="rounded-full border border-borde px-3 py-1">Final</span>
                  <span className="rounded-full border border-borde px-3 py-1">Resumen</span>
                </div>
              </div>
              <ul className="divide-y divide-borde border-t border-borde">
                {EJEMPLO.map((e) => (
                  <li key={e.titulo} className="flex items-center gap-3.5 px-5 py-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-acento/10 font-mono text-[9px] font-semibold uppercase text-acento">
                      {e.ext}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.titulo}</p>
                      <p className="truncate text-xs text-tenue">{e.meta}</p>
                    </div>
                    <span className="hidden rounded-full border border-borde px-2 py-0.5 text-[11px] text-tenue sm:inline">
                      {e.tipo}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- Cómo funciona ---------- */}
        <section id="como-funciona" className="scroll-mt-20 border-t border-borde py-20">
          <h2 className="revelar text-3xl font-bold tracking-tight">Cómo funciona</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="revelar">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-borde font-display text-sm font-bold text-acento">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-bold">{p.titulo}</h3>
                <p className="mt-2 leading-relaxed text-tenue">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Reglas ---------- */}
        <section className="grid gap-4 border-t border-borde py-20 md:grid-cols-2">
          {[
            { titulo: "Qué podés compartir", items: SI, color: "text-exito", simbolo: "✓" },
            { titulo: "Qué no", items: NO, color: "text-peligro", simbolo: "✕" },
          ].map((bloque) => (
            <div key={bloque.titulo} className="revelar tarjeta p-7">
              <h2 className="text-xl font-bold tracking-tight">{bloque.titulo}</h2>
              <ul className="mt-5 space-y-3">
                {bloque.items.map((t) => (
                  <li key={t} className="flex gap-3 text-[15px]">
                    <span aria-hidden className={`font-semibold ${bloque.color}`}>
                      {bloque.simbolo}
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <div className="revelar pb-20">
          <Donacion />
        </div>
      </main>

      <footer className="border-t border-borde">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-8 text-sm text-tenue">
          <span>Usal Estudia no es un sitio oficial de la Universidad del Salvador.</span>
          <span>
            <Link href="/privacidad" className="transition hover:text-texto">Privacidad</Link>
            {" · "}
            <Link href="/terminos" className="transition hover:text-texto">Términos</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
