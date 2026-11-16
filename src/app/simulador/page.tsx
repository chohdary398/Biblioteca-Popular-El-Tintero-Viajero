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
          Armá tu cuenta en tres pasos: tu cuota, los talleres que te gustan y lo que necesites de los servicios.
          Si querés, la guardás para mirarla después.
        </p>
      </FichaHero>
      <Simulador rows={rows} />
    </main>
  );
}
