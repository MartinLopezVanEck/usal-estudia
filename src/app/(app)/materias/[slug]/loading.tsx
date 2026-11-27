import { Bloque, Cargando, EsqueletoLista } from "@/components/esqueleto";

export default function CargandoMateria() {
  return (
    <Cargando>
      <Bloque className="mb-4 h-4 w-64" />
      <Bloque className="h-9 w-72 max-w-full" />
      <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <div className="hidden space-y-2 md:block">
          {[0, 1, 2, 3].map((i) => (
            <Bloque key={i} className="h-9 w-full" />
          ))}
        </div>
        <div>
          <div className="mb-4 flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Bloque key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
          <EsqueletoLista />
        </div>
      </div>
    </Cargando>
  );
}
