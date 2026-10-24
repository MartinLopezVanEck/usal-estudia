import Link from "next/link";

export function Migas({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Ruta" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-tenue">
      <Link href="/" className="hover:text-texto">
        Carreras
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <span aria-hidden>/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-texto">
              {item.label}
            </Link>
          ) : (
            <span className="text-texto">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
