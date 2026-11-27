/** Bloques grises que se muestran mientras carga una página. */
export function Bloque({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-suave ${className}`} />;
}

export function EsqueletoLista({ filas = 6 }: { filas?: number }) {
  return (
    <div className="tarjeta divide-y divide-borde overflow-hidden">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-center gap-3.5 p-4">
          <Bloque className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Bloque className="h-4 w-2/3" />
            <Bloque className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Cargando({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      {children}
    </div>
  );
}
