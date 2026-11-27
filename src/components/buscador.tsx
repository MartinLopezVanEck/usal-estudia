"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function Buscador() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/buscar?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label className="relative block">
        <span className="sr-only">Buscar</span>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar materia, profesor, parcial..."
          className="input rounded-full bg-suave/60 py-2 pl-10 focus:bg-superficie"
        />
      </label>
    </form>
  );
}
