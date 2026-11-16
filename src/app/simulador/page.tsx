import { asc } from 'drizzle-orm';
import type { Metadata } from 'next';

import { Simulador } from './simulador';

import { FichaHero } from '@/components/ficha-hero';
import { db } from '@/db';
import { aranceles } from '@/db/schema';
import { loadPage } from '@/lib/load-page';


export const metadata: Metadata = {
  title: 'Simulador de Cuota',
  description:
    'Calculá cuánto te saldría la cuota social, los talleres y los servicios de la Biblioteca Popular El Tintero Viajero. Es una estimación.',
};

export default async function SimuladorPage() {
  const {
    data: [rows],
  } = await loadPage(() => [db.select().from(aranceles).orderBy(asc(aranceles.grupo), asc(aranceles.orden))]);

  return (
    <main>
      <FichaHero kicker="Ficha de cálculo · Paraná" stamp="Es solo una estimación" title="Simulador de Cuota">
        <p>
          Contanos si sos socio, qué talleres te gustan y por cuántos meses querés calcular. Te mostramos el detalle en una ficha.
        </p>
      </FichaHero>
      <Simulador rows={rows} />
    </main>
  );
}
