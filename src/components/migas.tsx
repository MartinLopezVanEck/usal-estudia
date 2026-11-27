import Link from "next/link";

export function Migas({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Ruta" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-tenue">
      <Link href="/carreras?todas=1" className="transition hover:text-acento">
        Carreras
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <span aria-hidden className="text-borde">/</span>
          {item.href ? (
            <Link href={item.href} className="transition hover:text-acento">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-texto">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
