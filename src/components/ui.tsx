import type { ReactNode } from 'react';

// The app-page pieces every dashboard, list, admin and detail page uses (_system-docs/design.md §3–4). They read the
// project's tokens (bg-brand, font-display), so a new look in globals.css restyles every page at once.

export const button = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-[#F4EDE0] shadow-sm transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-[#6E7F5A] bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#6E7F5A] transition-colors hover:bg-[#F4EDE0] focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50',
};
export const input =
  'mt-1.5 w-full rounded-lg border border-[#6E7F5A] bg-[#FFFFFF] px-3 py-2 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20';

/** An app page: the soft surface, the title row (title, one line, the main action), then the content. */
export function AppPage(props: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[70dvh] bg-[#F4EDE0]">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{props.title}</h1>
            {props.description && <p className="mt-1 text-[#6E7F5A]">{props.description}</p>}
          </div>
          {props.action}
        </div>
        <div className="mt-8 grid gap-6">{props.children}</div>
      </main>
    </div>
  );
}

/** A white card; `title` (with `action` on its right) gives it a header row. */
export function Card(props: {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-[#6E7F5A] bg-[#FFFFFF] shadow-sm ${props.className ?? ''}`}
    >
      {props.title && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#6E7F5A] px-4 py-3 sm:px-6">
          <h2 className="font-medium">{props.title}</h2>
          {props.action}
        </div>
      )}
      <div className="p-4 sm:p-6">{props.children}</div>
    </section>
  );
}

/** One figure of a dashboard: put 2–4 in `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`. */
export function Stat(props: { label: ReactNode; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#6E7F5A] bg-[#FFFFFF] p-5 shadow-sm">
      <p className="text-sm text-[#6E7F5A]">{props.label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{props.value}</p>
      {props.hint && <p className="mt-1 text-sm text-[#6E7F5A]">{props.hint}</p>}
    </div>
  );
}

const tones = {
  green: 'bg-[#F4EDE0] text-[#6E7F5A] ring-[#6E7F5A]',
  amber: 'bg-[#F4EDE0] text-[#23395D] ring-[#23395D]',
  red: 'bg-[#F4EDE0] text-[#E23A3A] ring-[#E23A3A]',
  blue: 'bg-[#F4EDE0] text-[#23395D] ring-[#23395D]',
  gray: 'bg-[#F4EDE0] text-[#6E7F5A] ring-[#6E7F5A]',
};
/** A status pill: green = done/paid, amber = pending, red = overdue/failed, blue = new/in progress, gray = draft. */
export function Badge(props: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[props.tone ?? 'gray']}`}
    >
      {props.children}
    </span>
  );
}

/** What an empty list or a first-run dashboard shows: a title, one line of help and the action that fills it. */
export function EmptyState(props: { title: ReactNode; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="rounded-full bg-brand/10 p-3 text-brand">
        <svg
          aria-hidden
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mt-4 font-medium">{props.title}</p>
      {props.text && <p className="mt-1 max-w-sm text-sm text-[#6E7F5A]">{props.text}</p>}
      {props.action && <div className="mt-5">{props.action}</div>}
    </div>
  );
}
