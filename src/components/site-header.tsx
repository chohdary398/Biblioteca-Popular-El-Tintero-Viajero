import Link from 'next/link';

import { NavLinks } from '@/components/nav-links';
import { hasShell, site } from '@/lib/site';

// Cabecera de todas las pantallas: tinta azul con las solapas del fichero. Los links se editan en src/lib/site.ts.
export function SiteHeader() {
  if (!hasShell()) return null;
  return (
    <header className="bg-brand text-[#F4EDE0]">
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <Link
            aria-label={`${site.name}, ir al inicio`}
            className="flex items-center gap-3 pb-1 focus-visible:outline-[#F4EDE0] sm:pb-3"
            href="/"
          >
            {site.logo ? (
              <img alt="" className="h-12 w-auto" src={site.logo} />
            ) : (
              <span
                aria-hidden
                className="grid size-12 shrink-0 place-items-center rounded-lg border-2 border-[#F4EDE0]/70 bg-[#F4EDE0]/10"
              >
                <svg className="size-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z" strokeLinejoin="round" />
                  <path d="M12 6.5v13" />
                </svg>
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-sm font-bold tracking-wide text-[#F4EDE0]/85 uppercase">
                {site.nameLines[0]}
              </span>
              <span className="block font-display text-xl leading-tight font-black sm:text-2xl">
                {site.nameLines[1]}
              </span>
            </span>
          </Link>
          <NavLinks links={site.nav} />
        </div>
      </div>
    </header>
  );
}
