"use client";

import { useOptimistic, useState, useTransition } from "react";
import { alternarVoto, reportarArchivo } from "@/app/(app)/acciones";
import { MOTIVOS_REPORTE } from "@/lib/constants";

/** Copia el link del archivo (sin filtros) para pasarlo por WhatsApp. */
export function CopiarLink({ id }: { id: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const url = `${location.origin}/archivos/${id}`;
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Compartir cancelado o sin permiso de portapapeles: no hacemos nada.
    }
  }

  return (
    <button type="button" onClick={copiar} className="btn-secundario">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {copiado ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
        )}
      </svg>
      {copiado ? "¡Link copiado!" : "Copiar link"}
    </button>
  );
}

/** "Me sirvió": se actualiza al instante y se guarda en segundo plano. */
export function BotonUtil({ id, votos, votado }: { id: string; votos: number; votado: boolean }) {
  const [estado, setEstado] = useState({ votos, votado });
  const [optimista, aplicar] = useOptimistic(estado, (s, votar: boolean) => ({
    votado: votar,
    votos: s.votos + (votar ? 1 : -1),
  }));
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  function alternar() {
    const votar = !optimista.votado;
    setError("");
    startTransition(async () => {
      aplicar(votar);
      const r = await alternarVoto(id, votar);
      if (r.ok) setEstado({ votado: votar, votos: estado.votos + (votar ? 1 : -1) });
      else setError(r.error);
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={alternar}
        aria-pressed={optimista.votado}
        className={`btn border ${
          optimista.votado
            ? "border-acento bg-acento/10 text-acento"
            : "border-borde bg-superficie hover:border-texto/20 hover:bg-suave"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={optimista.votado ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.4 22H7V10l4-8a3 3 0 0 1 4 3.9z" />
        </svg>
        Me sirvió{optimista.votos > 0 && <span className="tabular-nums">· {optimista.votos}</span>}
      </button>
      {error && <span className="mt-1 text-xs text-peligro">{error}</span>}
    </span>
  );
}

/** Desplegable para avisar que un archivo tiene un problema. */
export function Reportar({ id }: { id: string }) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, startTransition] = useTransition();
  const [resultado, setResultado] = useState<"" | "ok" | string>("");

  function enviar(fd: FormData) {
    startTransition(async () => {
      const r = await reportarArchivo(id, String(fd.get("motivo")), String(fd.get("detalle") ?? ""));
      setResultado(r.ok ? "ok" : r.error);
    });
  }

  if (resultado === "ok") {
    return <p className="text-sm text-exito">¡Gracias! Un admin lo va a revisar.</p>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="text-sm text-tenue underline-offset-4 transition hover:text-peligro hover:underline"
      >
        Reportar un problema
      </button>
      {abierto && (
        <form action={enviar} className="tarjeta absolute right-0 z-10 mt-2 w-80 max-w-[calc(100vw-2rem)] space-y-3 p-4 shadow-xl">
          <fieldset className="space-y-1.5">
            <legend className="etiqueta">¿Qué pasa con este archivo?</legend>
            {Object.entries(MOTIVOS_REPORTE).map(([clave, texto], i) => (
              <label key={clave} className="flex items-center gap-2 text-sm">
                <input type="radio" name="motivo" value={clave} defaultChecked={i === 0} className="accent-acento" />
                {texto}
              </label>
            ))}
          </fieldset>
          <textarea name="detalle" rows={2} maxLength={500} placeholder="Detalle (opcional)" className="input" />
          {resultado && <p className="text-xs text-peligro">{resultado}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAbierto(false)} className="btn-secundario">
              Cancelar
            </button>
            <button disabled={enviando} className="btn-primario">
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
