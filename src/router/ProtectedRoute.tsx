import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

type ProtectedRouteProps = {
  /** Contenido protegido. Si se omite, se usa como ruta de diseño y protege a sus rutas hijas. */
  children?: ReactNode
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
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const restaurando = useAuthStore((estado) => estado.restaurando)
  const autenticado = useAuthStore((estado) => estado.autenticado())

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

  return children ? <>{children}</> : <Outlet />
}
