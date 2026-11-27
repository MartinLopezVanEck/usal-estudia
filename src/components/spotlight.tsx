"use client";

import { useEffect } from "react";

/**
 * Un único listener para toda la página: pasa la posición del mouse a la tarjeta
 * .spotlight que está debajo, para que el brillo verde la siga.
 */
export function Spotlight() {
  useEffect(() => {
    function mover(e: PointerEvent) {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(".spotlight");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - r.left}px`);
      el.style.setProperty("--y", `${e.clientY - r.top}px`);
    }
    document.addEventListener("pointermove", mover, { passive: true });
    return () => document.removeEventListener("pointermove", mover);
  }, []);
  return null;
}
