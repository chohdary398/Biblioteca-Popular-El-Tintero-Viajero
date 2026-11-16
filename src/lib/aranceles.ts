// Tipos y ayudas compartidas por las dos pantallas (lista de aranceles y simulador).

export type Grupo = 'cuotas' | 'talleres' | 'servicios';

export type Arancel = {
  id: string;
  grupo: string;
  nombre: string;
  precio: number | null;
  unidad: string;
  estado: string;
  cupo: number | null;
  horario: string | null;
  orden: number;
};

export const DESCUENTO_SOCIO = 20;

export const GRUPOS: { id: Grupo; titulo: string; singular: string }[] = [
  { id: 'cuotas', titulo: 'Cuotas sociales', singular: 'Cuota' },
  { id: 'talleres', titulo: 'Talleres', singular: 'Taller' },
  { id: 'servicios', titulo: 'Servicios', singular: 'Servicio' },
];

/** Precio de socio: 20% menos, redondeado a pesos enteros. */
export const conDescuento = (precio: number) => Math.round((precio * (100 - DESCUENTO_SOCIO)) / 100);

/** Formato es-AR: $3.500 (con punto de miles, también en cuatro cifras). */
export const formatARS = (n: number) => {
  const r = Math.round(n);
  return `${r < 0 ? '-' : ''}$${String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

/** Minúsculas y sin tildes, para buscar "encuadernacion" y encontrar "Encuadernación". */
export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();

export const ordenar = (rows: Arancel[]) => {
  const rank = (g: string) => GRUPOS.findIndex((x) => x.id === g);
  return [...rows].sort((a, b) => rank(a.grupo) - rank(b.grupo) || a.orden - b.orden);
};
