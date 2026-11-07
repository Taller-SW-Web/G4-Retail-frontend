import { useContext } from 'react'
import { useEstadoConexion } from '../../hooks/useEstadoConexion'
import { ContingenciaContext } from '../../context/ContingenciaContext'
import Alert from './Alert'

/**
 * RF-26 / RF-28 / CA-10-01:
 * Banner reactivo que notifica la conmutación al modo contingencia offline,
 * el conteo de ventas pendientes en cola y el progreso de la resincronización.
 */
export default function OfflineBanner() {
  const ctx = useContext(ContingenciaContext)
  const enLineaDirecto = useEstadoConexion()

  const enLinea = ctx ? ctx.enLinea : enLineaDirecto
  const pendientesCount = ctx ? ctx.pendientesCount : 0
  const sincronizando = ctx ? ctx.sincronizando : false
  const progreso = ctx ? ctx.progreso : null
  const mensajeExito = ctx ? ctx.mensajeExito : null
  const errorSync = ctx ? ctx.errorSync : null

  if (mensajeExito) {
    return (
      <Alert tono="success" title="Sincronización completada" className="mx-auto mt-4 max-w-7xl">
        {mensajeExito}
      </Alert>
    )
  }

  if (sincronizando) {
    return (
      <Alert tono="info" title="Conexión restablecida — Sincronizando..." className="mx-auto mt-4 max-w-7xl">
        {progreso || 'Enviando ventas pendientes al servidor...'}
      </Alert>
    )
  }

  if (errorSync) {
    return (
      <Alert tono="error" title="Error de sincronización offline" className="mx-auto mt-4 max-w-7xl">
        {errorSync}
      </Alert>
    )
  }

  if (!enLinea) {
    return (
      <Alert
        tono="warning"
        title="Sin conexión con Retail — MODO CONTINGENCIA ACTIVO"
        className="mx-auto mt-4 max-w-7xl"
      >
        Caja operando en efectivo con catálogo local.
        {pendientesCount > 0
          ? ` Hay ${pendientesCount} ${pendientesCount === 1 ? 'venta' : 'ventas'} en cola local.`
          : ' Espera a que se restablezca la conexión antes de confirmar el cobro.'}
      </Alert>
    )
  }

  if (pendientesCount > 0 && ctx?.sincronizarCola) {
    return (
      <Alert tono="info" title="Ventas pendientes de sincronizar" className="mx-auto mt-4 max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <span>Hay {pendientesCount} ventas offline pendientes de sincronización.</span>
          <button
            onClick={() => void ctx.sincronizarCola()}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Sincronizar ahora
          </button>
        </div>
      </Alert>
    )
  }

  return null
}
