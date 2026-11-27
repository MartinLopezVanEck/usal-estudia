import { Bloque, Cargando } from "@/components/esqueleto";

export default function CargandoCarrera() {
  return (
    <Cargando>
      <Bloque className="mb-4 h-4 w-40" />
      <Bloque className="h-10 w-80 max-w-full" />
      <Bloque className="mt-6 h-11 w-full max-w-sm rounded-xl" />
      {[0, 1].map((anio) => (
        <div key={anio} className="mt-10">
          <Bloque className="mb-4 h-6 w-24" />
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((c) => (
              <div key={c} className="tarjeta space-y-3 p-4">
                <Bloque className="h-3 w-28" />
                {[0, 1, 2, 3].map((m) => (
                  <Bloque key={m} className="h-5 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Cargando>
  );
}
