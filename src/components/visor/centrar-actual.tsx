"use client";

import { useEffect } from "react";

/** Desplaza la lista lateral (no la página) para que el archivo actual quede a la vista. */
export function CentrarActual({ idLista }: { idLista: string }) {
  useEffect(() => {
    const lista = document.getElementById(idLista);
    const actual = lista?.querySelector<HTMLElement>("[aria-current='page']");
    if (lista && actual) lista.scrollTop = actual.offsetTop - lista.clientHeight / 2 + actual.clientHeight / 2;
  }, [idLista]);
  return null;
}
