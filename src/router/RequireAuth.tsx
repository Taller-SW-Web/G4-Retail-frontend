import { useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { toast } from '../store/toast'
import { ACCESO_RESTRINGIDO } from '../lib/permisos'
import type { Rol } from '../types'

interface RequireAuthProps {
  /** Roles locales admitidos; sin valor basta con tener sesión. */
  roles?: Rol[]
  children: ReactNode
}

/** RF-02: guardián de ruta. Sin sesión → /login; sin el rol requerido → vuelve al POS con aviso. */
export function RequireAuth({ roles, children }: RequireAuthProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const token = useAuthStore((s) => s.token)
  const autenticado = !!token && !!usuario
  const autorizado = autenticado && (!roles || roles.includes(usuario.rol))

  useEffect(() => {
    if (autenticado && !autorizado) toast.error(ACCESO_RESTRINGIDO)
  }, [autenticado, autorizado])

  if (!autenticado) return <Navigate to="/login" replace />
  if (!autorizado) return <Navigate to="/pos" replace />
  return children
}
