import { IconLogout, IconUserCircle } from '@tabler/icons-react'
import { useAuthStore } from '../../../store/authStore'

/**
 * Insignia de la sesión activa en la cabecera del mostrador (F1).
 *
 * Muestra quién está atendiendo. En un POS compartido entre turnos no es un adorno: evita que un
 * vendedor registre ventas con la sesión de otro, y permite cerrar sesión en un clic al cambiar de
 * turno.
 *
 * El nombre viene del token, porque es dato de Seguridad (G7); el código y el perfil vienen de
 * `GET /api/v1/retail/perfil`, que es lo que sabe Retail.
 */
export default function UserSessionBadge() {
  const perfil = useAuthStore((estado) => estado.perfil)
  const nombre = useAuthStore((estado) => estado.nombre)
  const salir = useAuthStore((estado) => estado.salir)

  if (!perfil) return null

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-inverse)] bg-[var(--color-surface-ink-soft)] px-4 py-2">
      <IconUserCircle size={28} className="shrink-0 text-[var(--color-accent-volt)]" aria-hidden="true" />

      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold">{nombre ?? perfil.codigoVendedor}</p>
        <p className="text-xs text-[var(--color-text-inverse)]/70">
          {perfil.codigoVendedor} · {perfil.perfilTienda === 'SUPERVISOR' ? 'Supervisor' : 'Vendedor'}
        </p>
      </div>

      <button
        type="button"
        onClick={salir}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="rounded-lg p-2 transition hover:bg-[var(--color-surface-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-volt)]"
      >
        <IconLogout size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
