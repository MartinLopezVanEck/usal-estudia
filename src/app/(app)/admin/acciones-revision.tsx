"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EstadoRevision } from "@/lib/constants";
import { aprobarArchivo, eliminarArchivo, rechazarArchivo } from "./actions";

export function AccionesRevision({ id, estado }: { id: string; estado: EstadoRevision }) {
  const [pendiente, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {estado !== "aprobado" && (
        <button
          className="btn-primario"
          disabled={pendiente}
          onClick={() => startTransition(() => aprobarArchivo(id))}
        >
          Aprobar
        </button>
      )}
      {estado !== "rechazado" && (
        <button
          className="btn-secundario"
          disabled={pendiente}
          onClick={() => {
            const motivo = prompt("Motivo del rechazo (lo ve quien lo subió). Podés dejarlo vacío:");
            if (motivo !== null) startTransition(() => rechazarArchivo(id, motivo));
          }}
        >
          Rechazar
        </button>
      )}
      <button
        className="btn-peligro"
        disabled={pendiente}
        onClick={() => {
          if (confirm("¿Eliminar el archivo definitivamente?")) {
            startTransition(async () => {
              await eliminarArchivo(id);
              router.push("/admin");
            });
          }
        }}
      >
        Eliminar
      </button>
    </div>
  );
}
