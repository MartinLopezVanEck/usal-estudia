import { Bloque, Cargando, EsqueletoLista } from "@/components/esqueleto";

export default function CargandoPagina() {
  return (
    <Cargando>
      <Bloque className="h-9 w-64" />
      <Bloque className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8">
        <EsqueletoLista />
      </div>
    </Cargando>
  );
}
