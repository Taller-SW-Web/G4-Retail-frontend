import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '../atoms/Spinner'
import { Alert } from '../molecules/Alert'
import { Toaster } from '../molecules/Toaster'
import { AppHeader } from '../organisms/AppHeader'
import { ShiftOpenModal } from '../organisms/ShiftOpenModal'
import { estadoCaja, listarPickups } from '../../services'
import { useCajaStore } from '../../store/caja'
import { usePickupStore } from '../../store/pickup'

/** Plantilla de la terminal: cabecera, contenido y control del turno de caja (RF-20). */
export function PosLayout() {
  const { pathname } = useLocation()
  const { caja, setCaja } = useCajaStore()
  const setPendientes = usePickupStore((s) => s.setPendientes)
  const [sinServicio, setSinServicio] = useState(false)

  useEffect(() => {
    estadoCaja()
      .then(setCaja)
      .catch(() => setSinServicio(true))
    listarPickups()
      .then((pedidos) => setPendientes(pedidos.filter((p) => p.estado === 'LISTO_PARA_RECOJO').length))
      .catch(() => {})
    return () => setCaja(null)
  }, [setCaja, setPendientes])

  // El cierre de caja muestra su propio resultado con el turno ya cerrado.
  const exigeApertura = caja?.estado === 'CERRADA' && pathname !== '/caja/cierre'

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1320px] flex-1 p-4 sm:p-6 md:p-8">
        {caja ? (
          <Outlet />
        ) : sinServicio ? (
          <Alert tono="error" title="No se pudo consultar el turno de caja">
            Revisa la conexión de la terminal y recarga la página.
          </Alert>
        ) : (
          <div className="flex justify-center p-8" role="status" aria-label="Cargando terminal">
            <Spinner size={24} />
          </div>
        )}
      </main>
      {exigeApertura && <ShiftOpenModal />}
      <Toaster />
    </div>
  )
}
