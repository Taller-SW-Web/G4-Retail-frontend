import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { IconCash, IconLogout, IconPackage, IconShoppingCart } from '@tabler/icons-react'
import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { Logo } from '../atoms/Logo'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { useAuthStore } from '../../store/auth'
import { useCajaStore } from '../../store/caja'
import { useCartStore } from '../../store/cart'
import { usePickupStore } from '../../store/pickup'
import { etiquetaRol } from '../../lib/format'
import { TIENDAS } from '../../lib/empresa'
import { puedeAcceder } from '../../lib/permisos'
import { cx } from '../../lib/cx'

const enlace = ({ isActive }: { isActive: boolean }) =>
  cx(
    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
    isActive ? 'bg-action-primary text-text-primary' : 'text-text-inverse hover:bg-surface-ink-soft',
  )

/** Barra superior de la terminal: navegación por rol, turno y sesión (RF-02, RF-03). */
export function AppHeader() {
  const usuario = useAuthStore((s) => s.usuario)!
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion)
  const nuevaVenta = useCartStore((s) => s.nuevaVenta)
  const caja = useCajaStore((s) => s.caja)
  const pendientes = usePickupStore((s) => s.pendientes)
  const [confirmando, setConfirmando] = useState(false)

  return (
    <header className="bg-surface-ink text-text-inverse print:hidden">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-4 px-4 py-2 sm:px-6 md:px-8">
        <Logo variant="volt" compact />
        <nav aria-label="Principal" className="order-last flex w-full gap-2 overflow-x-auto md:order-none md:w-auto">
          <NavLink to="/pos" className={enlace}>
            <IconShoppingCart size={20} aria-hidden />
            Venta
          </NavLink>
          <NavLink to="/pickup" className={enlace}>
            <IconPackage size={20} aria-hidden />
            Entregas en Tienda (Pickup)
            {pendientes !== null && <Badge tono="promo">{pendientes} pendientes</Badge>}
          </NavLink>
          {puedeAcceder(usuario.rol, '/caja/cierre') && (
            <NavLink to="/caja/cierre" className={enlace}>
              <IconCash size={20} aria-hidden />
              Cerrar Turno de Caja
            </NavLink>
          )}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-4">
          <div className="text-right text-xs">
            <p className="text-sm font-semibold">
              {usuario.nombres} {usuario.apellidos}
            </p>
            <p className="text-text-inverse/80">
              {etiquetaRol(usuario.rol)} · {TIENDAS[usuario.tiendaId]?.nombre ?? usuario.tiendaId}
            </p>
          </div>
          <Button variant="secondary" icon={<IconLogout size={20} aria-hidden />} onClick={() => setConfirmando(true)}>
            Cerrar Sesión
          </Button>
        </div>
      </div>
      {caja?.estado === 'ABIERTA' && (
        <p role="status" className="bg-accent-volt px-4 py-1 text-center text-xs font-semibold text-text-primary">
          Turno Abierto — {caja.terminalPos?.replace('POS-', 'Caja ')} | Cajero: {caja.cajero}
        </p>
      )}
      {confirmando && (
        <ConfirmDialog
          title="Cerrar sesión"
          confirmLabel="Cerrar Sesión"
          onCancel={() => setConfirmando(false)}
          onConfirm={() => {
            nuevaVenta()
            cerrarSesion()
          }}
        >
          ¿Está seguro de cerrar el turno de caja?
        </ConfirmDialog>
      )}
    </header>
  )
}
