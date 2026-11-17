import { asc } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ArancelesExplorer } from './aranceles-explorer';

import { FichaHero } from '@/components/ficha-hero';
import { db } from '@/db';
import { aranceles } from '@/db/schema';


export const metadata: Metadata = {
  title: 'Aranceles y Talleres',
  description:
    'Cuotas sociales, talleres y servicios de la Biblioteca Popular El Tintero Viajero, con buscador. Los socios pagan 20% menos en los talleres.',
};

export default async function Home() {
  const rows = await db.select().from(aranceles).orderBy(asc(aranceles.grupo), asc(aranceles.orden));

  return (
    <main>
      <FichaHero
        kicker="Ficha de aranceles · Paraná"
        stamp={
          <>
            Socios: 20% menos en talleres
          </>
        }
        title="Aranceles y Talleres"
      >
        <p>
          Cuánto sale hacerte socio, anotarte en un taller o sacar unas fotocopias. Buscá lo que necesitás, fijate
          los horarios y pasá por la mesa de préstamos cuando quieras.
        </p>
      </FichaHero>

      <ArancelesExplorer rows={rows} />

      <section className="bg-brand px-4 py-12 text-[#F4EDE0] sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-prose">
            <h2 className="font-display text-2xl font-black sm:text-3xl">¿Cuánto te saldría en total?</h2>
            <p className="mt-2 text-lg text-[#F4EDE0]/90">
              Elegí tu cuota, tildá los talleres y sumá fotocopias o lo que necesites. Es una cuenta de práctica: el
              cobro se hace en la mesa de préstamos.
            </p>
          </div>
          <Link
            className="inline-flex min-h-14 items-center justify-center rounded-lg bg-paper px-7 text-lg font-bold text-brand transition-colors hover:bg-[#FFFFFF] focus-visible:outline-[#F4EDE0]"
            href="/simulador"
          >
            Probar el simulador de cuota
          </Link>
        </div>
      </section>
    </main>
  );
}
