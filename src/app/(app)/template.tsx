/** Se vuelve a montar en cada navegación: cada página entra con un fundido suave. */
export default function Plantilla({ children }: { children: React.ReactNode }) {
  return <div className="animate-entrada">{children}</div>;
}
