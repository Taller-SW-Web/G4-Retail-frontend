import { IconAlertTriangle, IconLock, IconUser } from '@tabler/icons-react'
import { useEffect, useState, type FormEvent } from 'react'
import Button from '../components/atoms/Button'
import { useAuthStore } from '../store/authStore'

type LoginPageProps = {
  onLogin: () => void
}

/**
 * Inicio de sesión del vendedor (F1).
 *
 * El login es de Seguridad (G7), no de Retail: esta pantalla obtiene el token y recién después
 * consulta `GET /api/v1/retail/perfil` para saber qué puede hacer esa persona dentro de la tienda.
 * Esta semana quien responde el login es el mock del front.
 */
export default function LoginPage({ onLogin }: LoginPageProps) {
  const [correo, setCorreo] = useState('vendedor1@inkaathletics.pe')
  const [clave, setClave] = useState('Retail2026!')

  const autenticado = useAuthStore((estado) => estado.autenticado())
  const entrar = useAuthStore((estado) => estado.entrar)
  const cargando = useAuthStore((estado) => estado.cargando)
  const error = useAuthStore((estado) => estado.error)

  // La restauracion de la sesion guardada es asincrona, asi que el router alcanza a traer al
  // vendedor hasta aqui. Si ya tiene sesion valida, se le devuelve al mostrador sin pedirle nada.
  useEffect(() => {
    if (autenticado) onLogin()
  }, [autenticado, onLogin])

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (await entrar(correo, clave)) onLogin()
  }

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

            <form className="space-y-5" onSubmit={enviar}>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  <IconUser size={16} /> Correo
                </span>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={correo}
                  onChange={(evento) => setCorreo(evento.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-cloud)] px-4 py-3 outline-none transition focus:border-[var(--color-accent-signal)] focus:ring-2 focus:ring-[var(--color-accent-signal-soft)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  <IconLock size={16} /> Contraseña
                </span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={clave}
                  onChange={(evento) => setClave(evento.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-cloud)] px-4 py-3 outline-none transition focus:border-[var(--color-accent-signal)] focus:ring-2 focus:ring-[var(--color-accent-signal-soft)]"
                />
              </label>

              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-[#E03131] bg-[#FFF5F5] px-4 py-3 text-sm text-[#E03131]"
                >
                  <IconAlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}

              <Button type="submit" className="w-full py-3" disabled={cargando}>
                {cargando ? 'Verificando…' : 'Entrar al mostrador'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
