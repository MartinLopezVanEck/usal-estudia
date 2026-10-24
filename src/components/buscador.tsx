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
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar materia, profesor, parcial..."
        className="input"
      />
    </form>
  );
}
