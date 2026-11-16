import type { ReactNode } from 'react';

// Portada de cada pantalla: una ficha grande con renglones, el título en tinta azul y un sello rojo.
export function FichaHero(props: {
  kicker: string;
  title: string;
  stamp: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-4 pt-8 pb-8 sm:px-6 sm:pt-12 sm:pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="ficha ficha-pila ficha-lines mr-3 mb-3 p-6 sm:mr-4 sm:mb-4 sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <p className="text-base font-bold tracking-wide text-sage uppercase">{props.kicker}</p>
              <div className="my-3 h-0.5 w-full bg-accent/70" />
              <h1 className="font-display text-3xl leading-tight font-black text-brand sm:text-5xl">
                {props.title}
              </h1>
              <div className="mt-4 max-w-prose bg-[#F4EDE0]/85 text-xl leading-8">{props.children}</div>
            </div>
            <div className="flex min-w-0 justify-center overflow-hidden px-2 py-3 lg:px-6">
              <span className="sello max-w-full px-4 text-xl sm:max-w-64 sm:text-3xl">{props.stamp}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
