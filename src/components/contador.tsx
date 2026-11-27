"use client";

import { useEffect, useRef, useState } from "react";

/** Número que cuenta desde 0 hasta `valor` cuando aparece en pantalla. */
export function Contador({ valor }: { valor: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(valor);

  useEffect(() => {
    const el = ref.current;
    if (!el || valor === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(0);
    let frame = 0;
    const obs = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return;
      obs.disconnect();
      const inicio = performance.now();
      const paso = (t: number) => {
        const p = Math.min((t - inicio) / 1400, 1);
        setN(Math.round(valor * (1 - Math.pow(1 - p, 4))));
        if (p < 1) frame = requestAnimationFrame(paso);
      };
      frame = requestAnimationFrame(paso);
    });
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [valor]);

  return <span ref={ref}>{n.toLocaleString("es-AR")}</span>;
}
