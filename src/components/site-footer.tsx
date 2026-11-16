import Link from 'next/link';

import { hasShell, site } from '@/lib/site';

// Pie de todas las pantallas. Sin dirección ni teléfono inventados: si la biblioteca los pasa, se suman acá.
export function SiteFooter() {
  if (!hasShell()) return null;
  return (
    <footer className="border-t-4 border-accent bg-brand text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="font-display text-2xl leading-tight font-black">{site.name}</p>
          <p className="mt-1 font-bold text-white/85">Paraná, Argentina</p>
          <p className="mt-4 max-w-prose text-white/90">
            Los valores de esta página son de referencia. Los cobros se hacen siempre en la mesa de préstamos de la
            biblioteca.
          </p>
        </div>
        <nav aria-label="Pie de página">
          <p className="text-sm font-bold tracking-wide text-white/85 uppercase">En esta página</p>
          <ul className="mt-2 grid gap-1">
            {site.nav.map((l) => (
              <li key={l.href}>
                <Link
                  className="inline-flex min-h-12 items-center text-lg font-bold underline decoration-white/50 underline-offset-4 hover:decoration-white focus-visible:outline-white"
                  href={l.href}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
