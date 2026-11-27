/** Marca de Usal Estudia: libro abierto sobre un cuadrado verde, más el nombre. */
export function Marca({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[28%] bg-linear-to-br from-acento to-acento-fuerte text-white shadow-sm shadow-acento/30 dark:from-acento dark:to-[#0a7a52] ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
        <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
      </svg>
    </span>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
      <Marca />
      <span>
        Usal <span className="text-acento">Estudia</span>
      </span>
    </span>
  );
}
