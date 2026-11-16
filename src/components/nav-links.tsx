'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Las dos pestañas de arriba, como solapas de fichero: la activa se funde con el papel de la página.
export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="grid grid-cols-2 gap-2 sm:flex">
      {links.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-14 items-center justify-center rounded-t-xl px-3 text-center text-base leading-tight font-bold transition-colors focus-visible:outline-white sm:px-6 ${
              active ? 'bg-paper text-brand' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            href={l.href}
            key={l.href}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
