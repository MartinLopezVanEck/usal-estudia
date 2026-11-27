"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** ← y → pasan al archivo anterior/siguiente. No interfiere si estás escribiendo. */
export function AtajosVisor({ anterior, siguiente }: { anterior?: string; siguiente?: string }) {
  const router = useRouter();

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      const destino = e.key === "ArrowLeft" ? anterior : e.key === "ArrowRight" ? siguiente : undefined;
      if (destino) {
        e.preventDefault();
        router.push(destino);
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [anterior, siguiente, router]);

  return null;
}
