'use client';

import { useId, useMemo, useState } from 'react';

import {
  type Arancel,
  conDescuento,
  DESCUENTO_SOCIO,
  formatARS,
  GRUPOS,
  normalizar,
  ordenar,
} from '@/lib/aranceles';

type Filtro = 'todos' | (typeof GRUPOS)[number]['id'];

const TABS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  ...GRUPOS.map((g) => ({ id: g.id, label: g.titulo })),
];

export function ArancelesExplorer({ rows }: { rows: Arancel[] }) {
  const searchId = useId();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [socio, setSocio] = useState(true);

  const todos = useMemo(() => ordenar(rows), [rows]);
  const query = normalizar(q);

  // Los conteos de cada solapa respetan la búsqueda; así nadie toca una solapa vacía sin saberlo.
  const coincide = useMemo(
    () =>
      todos.filter(
        (r) => !query || normalizar(`${r.nombre} ${r.horario ?? ''} ${r.unidad}`).includes(query),
      ),
    [todos, query],
  );
  const visibles = coincide.filter((r) => filtro === 'todos' || r.grupo === filtro);
  const cuenta = (id: Filtro) => coincide.filter((r) => id === 'todos' || r.grupo === id).length;
  const muestraSwitch = filtro === 'todos' || filtro === 'talleres';

  return (
    <section aria-label="Lista de aranceles" className="px-4 pb-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl bg-brand p-5 text-white shadow-lg sm:p-7">
          <label className="block text-lg font-bold" htmlFor={searchId}>
            ¿Qué estás buscando?
          </label>
          <div className="relative mt-2">
            <svg
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-6 -translate-y-1/2 text-brand"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" strokeLinecap="round" />
            </svg>
            <input
              autoComplete="off"
              className="h-14 w-full rounded-lg border-2 border-transparent bg-white pr-14 pl-13 text-xl text-ink placeholder:text-ink/60 focus-visible:outline-white"
              id={searchId}
              onChange={(e) => { setQ(e.target.value); }}
              placeholder="Por ejemplo: encuadernación"
              type="search"
              value={q}
            />
            {q ? (
              <button
                aria-label="Borrar lo que escribiste"
                className="absolute top-1/2 right-1 grid size-12 -translate-y-1/2 place-items-center rounded-md text-brand hover:bg-brand/10 focus-visible:outline-brand"
                onClick={() => { setQ(''); }}
                type="button"
              >
                <svg aria-hidden className="size-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
          </div>

          <div aria-label="Filtrar por grupo" className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4" role="group">
            {TABS.map((t) => {
              const on = filtro === t.id;
              return (
                <button
                  aria-pressed={on}
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 px-3 text-center text-lg leading-tight font-bold transition-colors focus-visible:outline-white ${
                    on
                      ? 'border-white bg-white text-brand'
                      : 'border-white/40 bg-white/5 text-white hover:bg-white/15'
                  }`}
                  key={t.id}
                  onClick={() => { setFiltro(t.id); }}
                  type="button"
                >
                  {t.label}
                  <span
                    className={`rounded-full px-2 text-base ${on ? 'bg-brand text-white' : 'bg-white/20 text-white'}`}
                  >
                    {cuenta(t.id)}
                  </span>
                </button>
              );
            })}
          </div>

          {muestraSwitch ? (
            <div className="mt-5 flex items-center gap-4 border-t border-white/25 pt-5">
              <button
                aria-checked={socio}
                aria-labelledby={`${searchId}-socio`}
                className={`relative h-10 w-[4.5rem] shrink-0 rounded-full border-2 border-white transition-colors focus-visible:outline-white ${
                  socio ? 'bg-accent' : 'bg-white/20'
                }`}
                onClick={() => { setSocio((v) => !v); }}
                role="switch"
                type="button"
              >
                <span
                  className={`absolute top-0.5 size-7 rounded-full bg-white shadow transition-all ${
                    socio ? 'left-[2.2rem]' : 'left-0.5'
                  }`}
                />
              </button>
              <span className="text-lg leading-snug font-bold" id={`${searchId}-socio`}>
                Soy socio o socia: mostrame los talleres con {DESCUENTO_SOCIO}% de descuento
              </span>
            </div>
          ) : null}
        </div>

        <p aria-live="polite" className="mt-6 text-lg font-bold text-brand" role="status">
          {visibles.length === 0
            ? 'No hay resultados.'
            : visibles.length === 1
              ? 'Encontramos 1 resultado.'
              : `Encontramos ${String(visibles.length)} resultados.`}
        </p>

        {visibles.length === 0 ? (
          <div className="ficha ficha-hole mt-4 p-6 pb-12 text-center sm:p-10 sm:pb-14">
            <p className="font-display text-2xl font-black text-brand">No encontramos nada con eso</p>
            <p className="mx-auto mt-2 max-w-prose text-lg">
              Probá con otra palabra, o mirá todo el listado. Si no aparece, preguntá en la mesa de préstamos.
            </p>
            <button
              className="mt-5 inline-flex min-h-14 items-center justify-center rounded-lg bg-brand px-7 text-lg font-bold text-white transition-colors hover:bg-brand/90"
              onClick={() => {
                setQ('');
                setFiltro('todos');
              }}
              type="button"
            >
              Ver todo el listado
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-12">
            {GRUPOS.map((g) => {
              const items = visibles.filter((r) => r.grupo === g.id);
              if (items.length === 0) return null;
              return (
                <section aria-labelledby={`g-${g.id}`} key={g.id}>
                  <h2
                    className="flex items-baseline gap-3 border-b-2 border-accent/70 pb-2 font-display text-2xl font-black text-brand sm:text-3xl"
                    id={`g-${g.id}`}
                  >
                    {g.titulo}
                    <span className="font-sans text-lg font-bold text-sage">{items.length}</span>
                  </h2>
                  {g.id === 'cuotas' ? (
                    <p className="mt-3 text-lg">Todas se pagan por mes, en la mesa de préstamos.</p>
                  ) : null}
                  {g.id === 'talleres' ? (
                    <p className="mt-3 text-lg">
                      Los cupos son orientativos. Los socios pagan {DESCUENTO_SOCIO}% menos que el precio de lista.
                    </p>
                  ) : null}
                  <ul className="mt-5 grid gap-6 md:grid-cols-2">
                    {items.map((r) => (
                      <li className="flex" key={r.id}>
                        <Ficha r={r} socio={socio} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Ficha({ r, socio }: { r: Arancel; socio: boolean }) {
  const grupo = GRUPOS.find((g) => g.id === r.grupo);
  const suspendido = r.estado === 'suspendido';
  const sinCargo = r.estado === 'sin_cargo' || r.precio === null;
  const esTaller = r.grupo === 'talleres' && r.precio !== null;
  const lista = r.precio ?? 0;
  const conDto = conDescuento(lista);

  return (
    <article
      className={`ficha ficha-hole flex w-full flex-col p-5 pb-12 sm:p-6 sm:pb-12 ${suspendido ? 'border-dashed border-accent/60' : ''}`}
    >
      <p className="text-base font-bold tracking-wide text-sage uppercase">
        {grupo?.singular ?? 'Ficha'} N.º {String(r.orden).padStart(2, '0')}
      </p>
      <h3 className="mt-1 font-display text-xl leading-snug font-black text-brand sm:text-2xl">{r.nombre}</h3>
      <div className="mt-3 h-0.5 bg-accent/70" />

      {suspendido ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="sello text-lg">Suspendido este mes</span>
          <p className="min-w-0 flex-1 basis-48 text-lg font-bold">Este taller vuelve el mes que viene</p>
        </div>
      ) : null}

      <div className="mt-4">
        {sinCargo ? (
          <span className="inline-block rounded-md bg-accent px-4 py-1 text-2xl font-bold text-white">Sin cargo</span>
        ) : esTaller ? (
          <>
            <p className="text-base font-bold text-sage">{socio ? 'Precio para socios' : 'Precio de lista'}</p>
            <p className="flex flex-wrap items-baseline gap-x-2 text-brand">
              <span className="text-4xl font-bold tabular-nums">{formatARS(socio ? conDto : lista)}</span>
              <span className="text-lg font-bold">{r.unidad}</span>
            </p>
            <p className="mt-1 text-lg">
              {socio ? (
                <>
                  Precio de lista: <s className="tabular-nums">{formatARS(lista)}</s>{' '}
                  <strong className="text-accent">· {DESCUENTO_SOCIO}% menos</strong>
                </>
              ) : (
                <>
                  Siendo socio: <strong className="tabular-nums">{formatARS(conDto)}</strong>{' '}
                  <strong className="text-accent">({DESCUENTO_SOCIO}% menos)</strong>
                </>
              )}
            </p>
          </>
        ) : (
          <p className="flex flex-wrap items-baseline gap-x-2 text-brand">
            <span className="text-4xl font-bold tabular-nums">{formatARS(lista)}</span>
            {r.unidad ? <span className="text-lg font-bold">{r.unidad}</span> : null}
          </p>
        )}
      </div>

      {r.grupo === 'talleres' && (r.cupo !== null || r.horario) ? (
        <dl className="mt-4 grid gap-1 border-t border-sage/30 pt-3 text-lg">
          {r.horario ? (
            <div className="flex gap-2">
              <dt className="font-bold text-sage">Horario:</dt>
              <dd>{r.horario}</dd>
            </div>
          ) : null}
          {r.cupo !== null ? (
            <div className="flex gap-2">
              <dt className="font-bold text-sage">Cupo:</dt>
              <dd className="tabular-nums">{r.cupo}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </article>
  );
}
