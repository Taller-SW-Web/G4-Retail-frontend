import { IconLock, IconUser } from '@tabler/icons-react'
import Button from '../components/atoms/Button'

type LoginPageProps = {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-cloud)] p-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--color-border-default)] bg-white shadow-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-[var(--color-surface-ink)] p-8 text-[var(--color-text-inverse)] lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-volt)]">Inka Athletics</p>
          <h1 className="font-heading mt-4 text-5xl uppercase leading-none">Retail POS</h1>
          <p className="mt-4 max-w-md text-base text-[var(--color-text-inverse)]/80">
            Gestiona ventas, stock y turnos del mostrador con una experiencia rápida y enfocada en el vendedor.
          </p>

          <div className="mt-10 space-y-4 text-sm">
            <div className="rounded-2xl border border-[var(--color-border-inverse)] bg-[var(--color-surface-ink-soft)] p-4">
              <p className="font-semibold">Cobro rápido</p>
              <p className="mt-1 text-[var(--color-text-inverse)]/70">Consulta pedidos y termina pagos en segundos.</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border-inverse)] bg-[var(--color-surface-ink-soft)] p-4">
              <p className="font-semibold">Stock al día</p>
              <p className="mt-1 text-[var(--color-text-inverse)]/70">Valida disponibilidad y evita ventas duplicadas.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Acceso</p>
              <h2 className="font-heading mt-2 text-3xl uppercase text-[var(--color-text-primary)]">Iniciar sesión</h2>
            </div>

            <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onLogin() }}>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  <IconUser size={16} /> Correo
                </span>
                <input
                  type="email"
                  defaultValue="vendedor1@inkaathletics.pe"
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-cloud)] px-4 py-3 outline-none transition focus:border-[var(--color-accent-signal)] focus:ring-2 focus:ring-[var(--color-accent-signal-soft)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  <IconLock size={16} /> Contraseña
                </span>
                <input
                  type="password"
                  defaultValue="Retail2026!"
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-cloud)] px-4 py-3 outline-none transition focus:border-[var(--color-accent-signal)] focus:ring-2 focus:ring-[var(--color-accent-signal-soft)]"
                />
              </label>

              <Button type="submit" className="w-full py-3">
                Entrar al mostrador
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
