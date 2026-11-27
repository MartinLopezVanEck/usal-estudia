"use client";

/** Alterna entre modo claro y oscuro y guarda la elección en el navegador. */
export function BotonTema() {
  function alternar() {
    const raiz = document.documentElement;
    const nuevo = raiz.dataset.theme === "dark" ? "light" : "dark";
    raiz.dataset.theme = nuevo;
    try {
      localStorage.setItem("tema", nuevo);
    } catch {
      // Sin almacenamiento (modo privado): el cambio dura hasta recargar.
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className="rounded-full p-2 text-tenue transition hover:rotate-12 hover:bg-suave hover:text-texto"
      aria-label="Cambiar entre modo claro y oscuro"
      title="Modo claro / oscuro"
    >
      {/* Luna en modo claro, sol en modo oscuro (lo decide el CSS, sin parpadeo) */}
      <svg viewBox="0 0 24 24" className="h-5 w-5 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden h-5 w-5 dark:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
