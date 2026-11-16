'use client';

import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

import { type Arancel, conDescuento, DESCUENTO_SOCIO, formatARS, ordenar } from '@/lib/aranceles';

type Linea = { label: string; detail: string; amount: number };
type Entrada = { id: string; date: string; lines: Linea[]; total: number };

// ---- Historial en el navegador (localStorage), sin base de datos ni cuentas ----
const KEY = 'tintero-viajero:historial';
const EVT = 'tintero-viajero:historial';
const MAX = 30;

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
    o.lines.every(esLinea)
  );
};
const parsear = (raw: string): Entrada[] => {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v as unknown[]).filter(esEntrada) : [];
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

function Stepper(props: {
  label: string;
  hint?: ReactNode;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
}) {
  const { value, onChange } = props;
  const boton =
    'grid size-12 shrink-0 place-items-center rounded-lg border-2 border-brand bg-white text-2xl leading-none font-bold text-brand transition-colors hover:bg-brand hover:text-white disabled:border-sage/40 disabled:text-sage/60 disabled:hover:bg-white disabled:hover:text-sage/60';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-sage/40 bg-white p-4">
      <div className="min-w-0 flex-1 basis-44">
        <p className="text-lg leading-snug font-bold">{props.label}</p>
        {props.hint ? <p className="text-base text-ink/80">{props.hint}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label={`Una menos: ${props.label}`}
          className={boton}
          disabled={value <= 0}
          onClick={() => { onChange(clamp(value - 1)); }}
          type="button"
        >
          −
        </button>
        <input
          aria-label={props.label}
          className="h-12 w-20 rounded-lg border-2 border-sage/60 bg-white text-center text-xl font-bold tabular-nums"
          inputMode="numeric"
          onChange={(e) => { onChange(clamp(Number(e.target.value.replace(/\D/g, '')))); }}
          onFocus={(e) => { e.target.select(); }}
          pattern="[0-9]*"
          type="text"
          value={String(value)}
        />
        <button
          aria-label={`Una más: ${props.label}`}
          className={boton}
          disabled={value >= 999}
          onClick={() => { onChange(clamp(value + 1)); }}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ---- Simulador ----
export function Simulador({ rows }: { rows: Arancel[] }) {
  const todos = useMemo(() => ordenar(rows), [rows]);
  const cuotas = todos.filter((r) => r.grupo === 'cuotas' && r.precio !== null);
  const talleres = todos.filter((r) => r.grupo === 'talleres' && r.precio !== null);
  const servicios = todos.filter((r) => r.grupo === 'servicios');
  const porId = (id: string) => servicios.find((s) => s.id === id);
  const sinCargo = servicios.filter((s) => s.estado === 'sin_cargo' || s.precio === null);

  const [cuotaId, setCuotaId] = useState(cuotas[0]?.id ?? '');
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [cant, setCant] = useState<Record<string, number>>({});
  const [libros, setLibros] = useState(0);
  const [dias, setDias] = useState(0);
  const [aviso, setAviso] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmaBorrar, setConfirmaBorrar] = useState(false);

  const q = (id: string) => cant[id] ?? 0;
  const setQ = (id: string, n: number) => {
    setCant((c) => ({ ...c, [id]: n }));
    setAviso(null);
  };

  const { lines, total, ahorro } = useMemo(() => {
    const out: Linea[] = [];
    let ahorroTalleres = 0;
    const cuota = cuotas.find((c) => c.id === cuotaId);
    if (cuota?.precio != null) out.push({ label: cuota.nombre, detail: `Cuota social ${cuota.unidad}`, amount: cuota.precio });
    for (const t of talleres) {
      if (t.estado === 'suspendido' || !elegidos.includes(t.id) || t.precio === null) continue;
      const socio = conDescuento(t.precio);
      ahorroTalleres += t.precio - socio;
      out.push({ label: t.nombre, detail: `Taller ${t.unidad}: lista ${formatARS(t.precio)}, con ${String(DESCUENTO_SOCIO)}% de socio`, amount: socio });
    }
    for (const s of servicios) {
      if (s.precio === null || s.id === 'serv-multa') continue;
      const n = cant[s.id] ?? 0;
      if (n > 0) out.push({ label: s.nombre, detail: `${String(n)} × ${formatARS(s.precio)}${s.unidad ? ` ${s.unidad}` : ''}`, amount: n * s.precio });
    }
    const multa = servicios.find((s) => s.id === 'serv-multa');
    if (multa?.precio != null && libros > 0 && dias > 0) {
      out.push({
        label: multa.nombre,
        detail: `${String(libros)} ${libros === 1 ? 'libro' : 'libros'} × ${String(dias)} ${dias === 1 ? 'día' : 'días'} × ${formatARS(multa.precio)}`,
        amount: libros * dias * multa.precio,
      });
    }
    return { lines: out, total: out.reduce((a, l) => a + l.amount, 0), ahorro: ahorroTalleres };
  }, [cuotas, talleres, servicios, cuotaId, elegidos, cant, libros, dias]);

  // Historial
  const raw = useSyncExternalStore(suscribir, leer, () => null);
  const historial = useMemo(() => (raw === null ? null : parsear(raw)), [raw]);

  const guardar = () => {
    const entrada: Entrada = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${String(Date.now())}-${String(Math.random())}`,
      date: new Date().toISOString(),
      lines,
      total,
    };
    const ok = escribir([entrada, ...(historial ?? [])].slice(0, MAX));
    setAviso(
      ok
        ? { ok: true, text: 'Listo, quedó guardado en tu historial.' }
        : { ok: false, text: 'No pudimos guardar en este navegador. Fijate si tenés el almacenamiento bloqueado.' },
    );
  };
  const borrarUna = (id: string) => escribir((historial ?? []).filter((e) => e.id !== id));
  const borrarTodo = () => {
    escribir([]);
    setConfirmaBorrar(false);
  };

  const resumen = (
    <div className="ficha ficha-hole p-5 pb-12 sm:p-7 sm:pb-12" id="resumen">
      <h2 className="font-display text-xl font-black text-brand sm:text-2xl">Tu cuenta estimada</h2>
      <div className="mt-3 h-0.5 bg-accent/70" />
      <ul className="mt-2">
        {lines.map((l) => (
          <li className="flex items-baseline justify-between gap-4 border-b border-dotted border-sage/60 py-3" key={l.label}>
            <div className="min-w-0">
              <p className="leading-snug font-bold break-words">{l.label}</p>
              <p className="text-base text-ink/80">{l.detail}</p>
            </div>
            <p className="shrink-0 text-xl font-bold tabular-nums">{formatARS(l.amount)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <p className="text-lg font-bold text-brand">Total estimado</p>
        <p aria-live="polite" className="text-4xl font-bold text-brand tabular-nums">
          {formatARS(total)}
        </p>
      </div>
      {ahorro > 0 ? (
        <p className="mt-2 text-lg font-bold text-accent">Por ser socio ahorrás {formatARS(ahorro)} en talleres.</p>
      ) : null}
      <p className="mt-4 border-l-4 border-accent bg-accent/5 py-2 pl-4 text-lg font-bold">
        Es una estimación: el cobro se hace en la mesa de préstamos.
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
            <Paso n={1} titulo="Elegí tu cuota social">
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                {cuotas.map((c) => (
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
                      <span className="block text-xl font-bold text-brand tabular-nums">
                        {formatARS(c.precio ?? 0)} <span className="text-base text-sage">{c.unidad}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </Paso>

            <Paso n={2} titulo="Sumá los talleres que te gusten">
              <p className="mb-4 text-lg">
                Como socio o socia pagás {DESCUENTO_SOCIO}% menos que el precio de lista.
              </p>
              <div className="grid gap-3">
                {talleres.map((t) => {
                  const susp = t.estado === 'suspendido';
                  const lista = t.precio ?? 0;
                  return (
                    <label className={opcion} key={t.id}>
                      <input
                        checked={!susp && elegidos.includes(t.id)}
                        className="mt-1 size-6 shrink-0 accent-brand"
                        disabled={susp}
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
                          <span className="text-xl font-bold text-brand tabular-nums">{formatARS(conDescuento(lista))}</span>
                          <span className="text-base text-ink/80">
                            socio, <s className="tabular-nums">{formatARS(lista)}</s> de lista · {t.unidad}
                          </span>
                        </span>
                        {susp ? (
                          <span className="mt-2 block">
                            <span className="sello text-base">Suspendido este mes</span>
                            <span className="mt-2 block font-bold">Este taller vuelve el mes que viene</span>
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Paso>

            <Paso n={3} titulo="Servicios, si necesitás alguno">
              <p className="mb-4 text-lg">Poné cuántas hojas o unidades. Si no usás ninguno, dejalo en cero.</p>
              <div className="grid gap-3">
                {(['serv-fotocopia', 'serv-color', 'serv-escaneo', 'serv-carne'] as const).map((id) => {
                  const s = porId(id);
                  if (!s || s.precio === null) return null;
                  return (
                    <Stepper
                      hint={`${formatARS(s.precio)}${s.unidad ? ` ${s.unidad}` : ' cada uno'}`}
                      key={id}
                      label={id === 'serv-carne' ? 'Reemplazo de carné' : s.nombre}
                      onChange={(n) => { setQ(id, n); }}
                      value={q(id)}
                    />
                  );
                })}
                {porId('serv-multa')?.precio != null ? (
                  <div className="grid gap-3 rounded-lg border-2 border-dashed border-sage/60 p-3 sm:p-4">
                    <p className="text-lg leading-snug font-bold">
                      Multa por demora{' '}
                      <span className="text-base font-normal text-ink/80">
                        ({formatARS(porId('serv-multa')?.precio ?? 0)} por libro y por día)
                      </span>
                    </p>
                    <Stepper
                      label="Libros con demora"
                      onChange={(n) => {
                        setLibros(n);
                        setAviso(null);
                      }}
                      value={libros}
                    />
                    <Stepper
                      label="Días de demora"
                      onChange={(n) => {
                        setDias(n);
                        setAviso(null);
                      }}
                      value={dias}
                    />
                  </div>
                ) : null}
              </div>
              {sinCargo.map((s) => (
                <p className="mt-4 flex flex-wrap items-center gap-3 text-lg" key={s.id}>
                  <span className="rounded-md bg-accent px-3 py-0.5 font-bold text-white">Sin cargo</span>
                  {s.nombre}: no suma nada a la cuenta.
                </p>
              ))}
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
              <p className="mt-1 text-lg">Queda en este dispositivo: no hace falta tener cuenta.</p>
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
