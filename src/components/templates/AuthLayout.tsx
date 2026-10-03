import type { ReactNode } from 'react'
import { Logo } from '../atoms/Logo'

/** Plantilla de acceso: panel de marca oscuro + formulario sobre superficie clara. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
      <section className="flex flex-col justify-between gap-8 bg-surface-ink p-8 text-text-inverse">
        <Logo variant="volt" />
        <div className="flex flex-col gap-2">
          <p className="font-heading text-[32px] leading-10 font-bold uppercase">Tu próxima venta empieza hoy</p>
          <p className="text-lg leading-[26px] font-semibold text-text-inverse/80">Terminal de mostrador · Canal Retail</p>
        </div>
      </section>
      <main className="flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="flex w-full max-w-md flex-col gap-6">{children}</div>
      </main>
    </div>
  )
}
