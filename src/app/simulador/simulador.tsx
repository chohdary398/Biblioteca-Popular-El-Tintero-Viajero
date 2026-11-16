'use client';

import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

import { type Arancel, conDescuento, DESCUENTO_SOCIO, formatARS, ordenar } from '@/lib/aranceles';

type Linea = { label: string; detail: string; amount: number };
type Entrada = {
  id: string;
  date: string;
  lines: Linea[];
  total: number;
  cuotaId: string;
  cuotaNombre: string;
  meses: 1 | 3 | 6;
  talleres: { id: string; nombre: string; monto: number }[];
  copias: number;
  desglose: { cuota: number; talleres: number; copias: number };
};

// ---- Historial en el navegador (localStorage), sin base de datos ni cuentas ----
const KEY = 'tintero_viajero_simulaciones_v1';
const EVT = 'tintero_viajero_simulaciones_v1';
const MAX = 3;

const leer = () => {
  try {
    return window.localStorage.getItem(KEY) ?? '[]';
  } catch {
    return '[]';
  }
};
const suscribir = (cb: () => void) => {
  window.addEventListener('storage', cb);
  window.addEventListener(EVT, cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(EVT, cb);
  };
};
const escribir = (lista: Entrada[]) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lista));
    window.dispatchEvent(new Event(EVT));
    return true;
  } catch {
    return false;
  }
};
const esLinea = (l: unknown): l is Linea => {
  const o = l as Partial<Linea> | null;
  return !!o && typeof o.label === 'string' && typeof o.detail === 'string' && typeof o.amount === 'number';
};
const esEntrada = (e: unknown): e is Entrada => {
  const o = e as Partial<Entrada> | null;
  return (
    !!o &&
    typeof o.id === 'string' &&
    typeof o.date === 'string' &&
    typeof o.total === 'number' &&
    Array.isArray(o.lines) &&
    o.lines.every(esLinea) &&
    typeof o.cuotaId === 'string' &&
    typeof o.cuotaNombre === 'string' &&
    (o.meses === 1 || o.meses === 3 || o.meses === 6) &&
    Array.isArray(o.talleres) &&
    typeof o.copias === 'number' &&
    !!o.desglose
  );
};
const parsear = (raw: string): Entrada[] => {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v as unknown[]).filter(esEntrada).slice(0, MAX) : [];
  } catch {
    return [];
  }
};

const fechaLarga = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Fecha desconocida';
  return d.toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
};

const clamp = (n: number) => Math.max(0, Math.min(999, Math.floor(Number.isFinite(n) ? n : 0)));
const MAX_TALLERES = 3;

// ---- Piezas ----
function Paso({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <fieldset className="ficha min-w-0 p-5 sm:p-7">
      <legend className="sr-only">{titulo}</legend>
      <h2 className="flex items-center gap-3 font-display text-xl leading-snug font-black text-brand sm:text-2xl">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent font-sans text-xl font-bold text-white"
        >
          {n}
        </span>
        {titulo}
      </h2>
      <div className="mt-3 mb-4 h-0.5 bg-accent/70" />
      {children}
    </fieldset>
  );
}

const opcion =
  'flex cursor-pointer items-start gap-4 rounded-lg border-2 border-sage/40 bg-white p-4 transition-colors hover:border-brand has-checked:border-brand has-checked:bg-brand/5 has-focus-visible:outline-4 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent has-disabled:cursor-not-allowed has-disabled:border-dashed has-disabled:bg-paper';

// ---- Simulador ----
export function Simulador({ rows }: { rows: Arancel[] }) {
  const todos = useMemo(() => ordenar(rows), [rows]);
  const cuotas = todos.filter((r) => r.grupo === 'cuotas' && r.precio !== null);
  const talleres = todos.filter((r) => r.grupo === 'talleres' && r.precio !== null);
  const precioCopia = todos.find((r) => r.id === 'serv-fotocopia')?.precio ?? 120;

  const [cuotaId, setCuotaId] = useState('no-socio');
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [copias, setCopias] = useState(0);
  const [meses, setMeses] = useState<1 | 3 | 6>(1);
  const [aviso, setAviso] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmaBorrar, setConfirmaBorrar] = useState(false);

  const cuota = cuotas.find((c) => c.id === cuotaId);
  const esSocio = !!cuota;
  const llenos = elegidos.length >= MAX_TALLERES;
  const precioTaller = (p: number) => (esSocio ? conDescuento(p) : p);

  const r = useMemo(() => {
    const mensualCuota = cuota?.precio ?? 0;
    const cuotaBruta = mensualCuota * meses;
    const ahorroCuota = meses === 6 ? Math.round(cuotaBruta * 0.15) : 0;
    const subCuota = cuotaBruta - ahorroCuota;
    const elegidosT = talleres.filter((t) => t.estado !== 'suspendido' && elegidos.includes(t.id));
    const mensualTalleres = elegidosT.reduce((a, t) => a + precioTaller(t.precio ?? 0), 0);
    const subTalleres = mensualTalleres * meses;
    const subCopias = copias * precioCopia * meses;
    const total = subCuota + subTalleres + subCopias;
    const mensualSinDesc = mensualCuota + mensualTalleres + copias * precioCopia;
    return { mensualCuota, ahorroCuota, subCuota, elegidosT, mensualTalleres, subTalleres, subCopias, total, mensualSinDesc };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuota, talleres, elegidos, copias, meses, precioCopia, esSocio]);

  const lines = useMemo(() => {
    const out: Linea[] = [];
    const m = `${String(meses)} ${meses === 1 ? 'mes' : 'meses'}`;
    if (cuota) {
      out.push({
        label: `Cuota social: ${cuota.nombre}`,
        detail: `${formatARS(r.mensualCuota)} × ${m}${meses === 6 ? ' con 15% de ahorro' : ''}`,
        amount: r.subCuota,
      });
    }
    for (const t of r.elegidosT) {
      out.push({ label: `Taller: ${t.nombre}`, detail: `${formatARS(precioTaller(t.precio ?? 0))} × ${m}`, amount: precioTaller(t.precio ?? 0) * meses });
    }
    if (copias > 0) out.push({ label: 'Fotocopias', detail: `${String(copias)} × ${formatARS(precioCopia)} × ${m}`, amount: r.subCopias });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, cuota, copias, meses, precioCopia, esSocio]);

  const total = r.total;
  const equivalente = total / meses;
  const nMeses = `${String(meses)} ${meses === 1 ? 'mes' : 'meses'}`;

  // Historial
  const raw = useSyncExternalStore(suscribir, leer, () => null);
  const historial = useMemo(() => (raw === null ? null : parsear(raw)), [raw]);

  const guardar = () => {
    const entrada: Entrada = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${String(Date.now())}-${String(Math.random())}`,
      date: new Date().toISOString(),
      lines,
      total,
      cuotaId,
      cuotaNombre: cuota ? cuota.nombre : 'No socio',
      meses,
      talleres: r.elegidosT.map((t) => ({ id: t.id, nombre: t.nombre, monto: precioTaller(t.precio ?? 0) * meses })),
      copias,
      desglose: { cuota: r.subCuota, talleres: r.subTalleres, copias: r.subCopias },
    };
    const ok = escribir([entrada, ...(historial ?? [])].slice(0, MAX));
    setAviso(
      ok
        ? { ok: true, text: 'Listo, quedó guardado en tu historial.' }
        : { ok: false, text: 'No pudimos guardar en este navegador. Fijate si tenés el almacenamiento bloqueado.' },
    );
  };
  const cargar = (e: Entrada) => {
    const cuotaOk = e.cuotaId === 'no-socio' || cuotas.some((c) => c.id === e.cuotaId);
    setCuotaId(cuotaOk ? e.cuotaId : 'no-socio');
    setElegidos(e.talleres.map((t) => t.id).filter((id) => talleres.some((t) => t.id === id)).slice(0, MAX_TALLERES));
    setCopias(clamp(e.copias));
    setMeses(e.meses);
    setAviso({ ok: true, text: 'Cargamos esa cuenta en el simulador. Podés revisarla o cambiarla.' });
    document.getElementById('resumen')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const borrarUna = (id: string) => escribir((historial ?? []).filter((e) => e.id !== id));
  const borrarTodo = () => {
    escribir([]);
    setConfirmaBorrar(false);
  };

  const fila = 'flex items-baseline justify-between gap-4 border-b border-dotted border-sage/60 py-3';
  const resumen = (
    <div className="ficha ficha-hole p-5 pb-12 sm:p-7 sm:pb-12" id="resumen">
      <h2 className="font-display text-xl font-black text-brand sm:text-2xl">Tu cuenta estimada · {nMeses}</h2>
      <div className="mt-3 h-0.5 bg-accent/70" />
      <ul className="mt-2">
        <li className={fila}>
          <div className="min-w-0">
            <p className="leading-snug font-bold">Subtotal Cuota Social</p>
            <p className="text-base text-ink/80">
              {!esSocio
                ? 'No socio: sin cuota social'
                : meses === 6
                  ? `${formatARS(r.mensualCuota)} × 6, con 15% de ahorro por 6 meses (ahorrás ${formatARS(r.ahorroCuota)})`
                  : `${formatARS(r.mensualCuota)} × ${nMeses}, sin descuento`}
            </p>
          </div>
          <p className="shrink-0 text-xl font-bold tabular-nums">{formatARS(r.subCuota)}</p>
        </li>
        <li className={fila}>
          <div className="min-w-0">
            <p className="leading-snug font-bold">Subtotal Talleres</p>
            <p className="text-base text-ink/80">
              {r.elegidosT.length === 0
                ? 'No elegiste talleres'
                : `${formatARS(r.mensualTalleres)} × ${nMeses}${esSocio ? ', con 20% de descuento de socio' : ', precio de lista'}`}
            </p>
          </div>
          <p className="shrink-0 text-xl font-bold tabular-nums">{formatARS(r.subTalleres)}</p>
        </li>
        <li className={fila}>
          <div className="min-w-0">
            <p className="leading-snug font-bold">Subtotal Fotocopias</p>
            <p className="text-base text-ink/80">
              {copias === 0 ? 'Sin fotocopias' : `${String(copias)} × ${formatARS(precioCopia)} × ${nMeses}, sin descuento`}
            </p>
          </div>
          <p className="shrink-0 text-xl font-bold tabular-nums">{formatARS(r.subCopias)}</p>
        </li>
      </ul>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <p className="text-lg font-bold text-brand">Total del período</p>
        <p aria-live="polite" className="text-4xl font-bold text-brand tabular-nums">
          {formatARS(total)} <span className="text-base">ARS</span>
        </p>
      </div>
      <p className="mt-3 text-xl font-bold text-accent">Te queda en {formatARS(equivalente)} por mes.</p>
      {meses === 6 ? (
        <p className="mt-1 text-lg">Sin el ahorro de 6 meses: {formatARS(r.mensualSinDesc)} ARS por mes.</p>
      ) : null}
      <p className="mt-4 border-l-4 border-accent bg-accent/5 py-2 pl-4 text-lg font-bold">
        Esta simulación es una estimación orientativa. Los importes pueden cambiar por decisión de la comisión de la biblioteca.
      </p>
      <button
        className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-brand px-6 text-lg font-bold text-white transition-colors hover:bg-brand/90"
        onClick={guardar}
        type="button"
      >
        Guardar en mi historial
      </button>
      {aviso ? (
        <p className={`mt-3 text-lg font-bold ${aviso.ok ? 'text-brand' : 'text-accent'}`} role="status">
          {aviso.text}
        </p>
      ) : null}
    </div>
  );


  return (
    <div className="px-4 pb-0 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="grid min-w-0 gap-8">
            <Paso n={1} titulo="Tu condición de socio">
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                {[{ id: 'no-socio', nombre: 'No socio (sin cuota social)', precio: null as number | null }, ...cuotas].map((c) => (
                  <label className={opcion} key={c.id}>
                    <input
                      checked={cuotaId === c.id}
                      className="mt-1 size-6 shrink-0 accent-brand"
                      name="cuota"
                      onChange={() => {
                        setCuotaId(c.id);
                        setAviso(null);
                      }}
                      type="radio"
                      value={c.id}
                    />
                    <span className="min-w-0">
                      <span className="block leading-snug font-bold">{c.nombre}</span>
                      {c.precio !== null ? (
                        <span className="block text-xl font-bold text-brand tabular-nums">
                          {formatARS(c.precio)} <span className="text-base text-sage">por mes</span>
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </Paso>

            <Paso n={2} titulo="Elegí hasta 3 talleres">
              <p className="mb-4 text-lg">
                {esSocio ? `Ves los precios con ${String(DESCUENTO_SOCIO)}% de descuento de socio.` : 'Ves el precio lleno, sin descuento de socio.'}
              </p>
              {llenos ? (
                <p className="mb-4 border-l-4 border-accent bg-accent/5 py-2 pl-4 text-lg font-bold" role="status">
                  Ya elegiste 3 talleres, que es el máximo. Para sumar otro, sacá uno.
                </p>
              ) : null}
              <div className="grid gap-3">
                {talleres.map((t) => {
                  const susp = t.estado === 'suspendido';
                  const marcado = !susp && elegidos.includes(t.id);
                  const bloqueado = susp || (llenos && !marcado);
                  return (
                    <label className={opcion} key={t.id}>
                      <input
                        checked={marcado}
                        className="mt-1 size-6 shrink-0 accent-brand"
                        disabled={bloqueado}
                        onChange={(e) => {
                          setElegidos((cur) => (e.target.checked ? [...cur, t.id] : cur.filter((x) => x !== t.id)));
                          setAviso(null);
                        }}
                        type="checkbox"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block leading-snug font-bold">{t.nombre}</span>
                        <span className="block text-base text-ink/80">
                          {t.horario}
                          {t.cupo !== null ? ` · Cupo: ${String(t.cupo)}` : ''}
                        </span>
                        <span className="mt-1 flex flex-wrap items-baseline gap-x-3">
                          <span className="text-xl font-bold text-brand tabular-nums">{formatARS(precioTaller(t.precio ?? 0))}</span>
                          <span className="text-base text-ink/80">
                            {esSocio ? (
                              <>
                                con descuento, <s className="tabular-nums">{formatARS(t.precio ?? 0)}</s> de lista
                              </>
                            ) : (
                              'precio lleno'
                            )}{' '}
                            · {t.unidad}
                          </span>
                        </span>
                        {susp ? (
                          <span className="mt-2 block">
                            <span className="sello text-base">Suspendido este mes</span>
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Paso>

            <Paso n={3} titulo="Fotocopias y período">
              <label className="block">
                <span className="block text-lg font-bold">Fotocopias por mes (opcional)</span>
                <span className="block text-base text-ink/80">Blanco y negro, {formatARS(precioCopia)} cada una.</span>
                <input
                  className="mt-2 h-14 w-full max-w-48 rounded-lg border-2 border-sage/60 bg-white px-4 text-xl font-bold tabular-nums"
                  inputMode="numeric"
                  min={0}
                  onChange={(e) => {
                    setCopias(clamp(Number(e.target.value)));
                    setAviso(null);
                  }}
                  type="number"
                  value={copias}
                />
              </label>
              <div className="mt-6">
                <p className="text-lg font-bold">¿Por cuánto tiempo?</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-3" role="radiogroup">
                  {([1, 3, 6] as const).map((m) => (
                    <label className={opcion} key={m}>
                      <input
                        checked={meses === m}
                        className="mt-1 size-6 shrink-0 accent-brand"
                        name="periodo"
                        onChange={() => {
                          setMeses(m);
                          setAviso(null);
                        }}
                        type="radio"
                      />
                      <span className="font-bold">{m === 1 ? '1 mes' : `${String(m)} meses`}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-base text-ink/80">A 6 meses, la cuota social tiene 15% de ahorro.</p>
              </div>
            </Paso>

          </div>

          <aside aria-label="Resumen" className="min-w-0 lg:sticky lg:top-6">
            {resumen}
          </aside>
        </div>

        <section aria-labelledby="historial" className="mt-16 pb-14">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-accent/70 pb-3">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-black text-brand sm:text-3xl" id="historial">
                Mi historial
              </h2>
              <p className="mt-1 text-lg">Guardamos tus últimas 3 cuentas en este dispositivo: no hace falta tener cuenta.</p>
            </div>
            {historial && historial.length > 0 ? (
              confirmaBorrar ? (
                <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Confirmar borrado">
                  <p className="text-lg font-bold">¿Borrar todo?</p>
                  <button
                    className="min-h-12 rounded-lg bg-accent px-5 text-lg font-bold text-white transition-colors hover:bg-accent/90"
                    onClick={borrarTodo}
                    type="button"
                  >
                    Sí, borrar todo
                  </button>
                  <button
                    className="min-h-12 rounded-lg border-2 border-brand px-5 text-lg font-bold text-brand transition-colors hover:bg-brand/10"
                    onClick={() => { setConfirmaBorrar(false); }}
                    type="button"
                  >
                    No, dejarlo
                  </button>
                </div>
              ) : (
                <button
                  className="min-h-12 rounded-lg border-2 border-brand px-5 text-lg font-bold text-brand transition-colors hover:bg-brand/10"
                  onClick={() => { setConfirmaBorrar(true); }}
                  type="button"
                >
                  Borrar todo el historial
                </button>
              )
            ) : null}
          </div>

          {historial === null ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2" aria-hidden>
              <div className="h-40 animate-pulse rounded-lg bg-brand/10" />
              <div className="h-40 animate-pulse rounded-lg bg-brand/10" />
            </div>
          ) : historial.length === 0 ? (
            <div className="ficha ficha-hole mt-6 p-6 pb-12 text-center sm:p-10 sm:pb-14">
              <p className="font-display text-2xl font-black text-brand">Todavía no guardaste ninguna cuenta</p>
              <p className="mx-auto mt-2 max-w-prose text-lg">
                Armá tu cuenta arriba y tocá «Guardar en mi historial»: la vas a encontrar acá cuando vuelvas.
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid gap-6 md:grid-cols-2">
              {historial.map((e) => (
                <li className="flex" key={e.id}>
                  <article className="ficha ficha-hole flex w-full flex-col p-5 pb-12 sm:p-6 sm:pb-12">
                    <p className="text-base font-bold text-sage">{fechaLarga(e.date)}</p>
                    <p className="mt-1 text-base">
                      {e.cuotaNombre} · {String(e.meses)} {e.meses === 1 ? 'mes' : 'meses'}
                    </p>
                    <div className="mt-2 h-0.5 bg-accent/70" />
                    <ul className="mt-2 flex-1">
                      {e.lines.map((l, i) => (
                        <li className="flex items-baseline justify-between gap-3 py-1" key={i}>
                          <span className="min-w-0 break-words">{l.label}</span>
                          <span className="shrink-0 font-bold tabular-nums">{formatARS(l.amount)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t-2 border-brand pt-3">
                      <p className="text-2xl font-bold text-brand tabular-nums">
                        <span className="mr-2 text-base">Total</span>
                        {formatARS(e.total)}
                      </p>
                      <button
                        className="min-h-12 rounded-lg bg-brand px-4 text-lg font-bold text-white transition-colors hover:bg-brand/90"
                        onClick={() => { cargar(e); }}
                        type="button"
                      >
                        Cargar
                      </button>
                      <button
                        aria-label={`Borrar la cuenta guardada el ${fechaLarga(e.date)}`}
                        className="min-h-12 rounded-lg border-2 border-accent px-4 text-lg font-bold text-accent transition-colors hover:bg-accent hover:text-white"
                        onClick={() => borrarUna(e.id)}
                        type="button"
                      >
                        Borrar
                      </button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-4 border-t-4 border-accent bg-brand px-4 py-3 text-white lg:hidden">
        <p className="text-lg font-bold">
          Total estimado <span className="ml-1 text-2xl tabular-nums">{formatARS(total)}</span>
        </p>
        <a
          className="inline-flex min-h-12 items-center rounded-lg bg-paper px-4 text-lg font-bold text-brand focus-visible:outline-white"
          href="#resumen"
        >
          Ver detalle
        </a>
      </div>
    </div>
  );
}
