import { Bloque, Cargando } from "@/components/esqueleto";

export default function CargandoArchivo() {
  return (
    <Cargando>
      <Bloque className="mb-4 h-4 w-72 max-w-full" />
      <div className="mb-5 flex justify-between">
        <Bloque className="h-5 w-32" />
        <Bloque className="h-9 w-32 rounded-full" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <Bloque className="h-8 w-2/3" />
          <Bloque className="mt-3 h-4 w-1/2" />
          <div className="mt-5 flex gap-2">
            <Bloque className="h-9 w-28 rounded-xl" />
            <Bloque className="h-9 w-28 rounded-xl" />
          </div>
          <Bloque className="mt-6 h-[60vh] w-full rounded-2xl" />
        </div>
        <Bloque className="hidden h-96 rounded-2xl lg:block" />
      </div>
    </Cargando>
  );
}
