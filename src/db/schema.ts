// The project's Drizzle schema — the source of truth for `npm run db:generate` (A3.5). Add the app's tables
// below. Event logs, telemetry and analytics streams do not belong in this database (A3.18).
export * from './schema.auth';

import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Aranceles de la biblioteca: cuotas sociales, talleres y servicios (precios en pesos argentinos).
export const aranceles = sqliteTable(
  'aranceles',
  {
    id: text().primaryKey(),
    grupo: text().notNull(), // 'cuotas' | 'talleres' | 'servicios'
    nombre: text().notNull(),
    precio: integer(), // ARS enteros; null = sin cargo
    unidad: text().notNull().default(''), // 'por mes', 'por hoja'…
    estado: text().notNull().default('vigente'), // 'vigente' | 'suspendido' | 'sin_cargo'
    cupo: integer(),
    horario: text(),
    orden: integer().notNull().default(0),
  },
  (t) => [index('aranceles_grupo_orden_idx').on(t.grupo, t.orden)],
);
