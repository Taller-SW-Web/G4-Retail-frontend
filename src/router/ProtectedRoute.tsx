import type { ReactNode } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import type { Perfil } from '../api/seguridad'
import { useAuthStore } from '../store/authStore'

type PerfilTienda = Perfil['perfilTienda']

type ProtectedRouteProps = {
  /** Contenido protegido. Si se omite, se usa como ruta de diseño y protege a sus rutas hijas. */
  children?: ReactNode
  /**
   * Perfiles que pueden ver la pantalla (RBAC). Si se omite, basta con tener sesión activa. Por
   * ejemplo, una pantalla de anulaciones podría declarar `rolesPermitidos={['SUPERVISOR']}`.
   */
  rolesPermitidos?: PerfilTienda[]
}

/**
 * Guardián de las rutas privadas del mostrador.
 *
 * Intercepta el acceso directo a una pantalla sin una sesión activa en `authStore` y redirige a
 * `/login`. Una sesión es activa si hay token, hay perfil operativo y el token no venció.
 *
 * Se usa como ruta de diseño, de modo que una sola declaración protege todas las pantallas privadas:
 *
 * ```tsx
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/pos" element={<PosPage />} />
 * </Route>
 * ```
 *
 * Mientras se restaura una sesión guardada no redirige: espera. Si redirigiera de inmediato,
 * recargar cualquier pantalla privada mandaría al login aunque la sesión fuera válida.
 *
 * Con `rolesPermitidos`, un vendedor con sesión válida pero sin el perfil requerido ve un aviso de
 * acceso restringido en lugar de la pantalla: no se le manda al login, porque su sesión está bien.
 */
export default function ProtectedRoute({ children, rolesPermitidos }: ProtectedRouteProps) {
  const restaurando = useAuthStore((estado) => estado.restaurando)
  const autenticado = useAuthStore((estado) => estado.autenticado())
  const perfil = useAuthStore((estado) => estado.perfil)

  if (restaurando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-cloud)]">
        <p role="status" className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Verificando sesión…
        </p>
      </main>
    )
  }

  if (!autenticado) return <Navigate to="/login" replace />

  if (rolesPermitidos && (!perfil || !rolesPermitidos.includes(perfil.perfilTienda))) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-surface-cloud)] p-6 text-center">
        <p role="alert" className="text-lg font-semibold text-[var(--color-text-primary)]">
          Acceso restringido
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Esta pantalla requiere el perfil {rolesPermitidos.join(' o ')}.
        </p>
        <Link to="/pos" className="text-sm font-semibold underline">
          Volver al mostrador
        </Link>
      </main>
    )
  }

  return children ? <>{children}</> : <Outlet />
}
