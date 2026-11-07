import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useEstadoConexion } from '../hooks/useEstadoConexion'
import {
  contarVentasPendientes,
  obtenerVentasPendientes,
  actualizarEstadoVentaOffline,
  guardarVentaOffline,
} from '../lib/offlineStorage'
import { sincronizarLoteContingencia } from '../api/contingencia'
import type { VentaOfflineRegistro } from '../types/contingencia'

interface ContingenciaContextType {
  enLinea: boolean
  pendientesCount: number
  sincronizando: boolean
  progreso: string | null
  mensajeExito: string | null
  errorSync: string | null
  registrarVentaOffline: (venta: VentaOfflineRegistro) => Promise<void>
  sincronizarCola: () => Promise<void>
  refrescarPendientes: () => Promise<void>
}

export const ContingenciaContext = createContext<ContingenciaContextType | null>(null)

export function ContingenciaProvider({ children }: { children: React.ReactNode }) {
  const enLinea = useEstadoConexion()
  const [pendientesCount, setPendientesCount] = useState<number>(0)
  const [sincronizando, setSincronizando] = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [errorSync, setErrorSync] = useState<string | null>(null)

  const eraOfflineRef = useRef(false)
  const sincronizandoRef = useRef(false)

  const refrescarPendientes = useCallback(async () => {
    try {
      const count = await contarVentasPendientes()
      setPendientesCount(count)
    } catch {
      // noop
    }
  }, [])

  useEffect(() => {
    void refrescarPendientes()
  }, [refrescarPendientes])

  const registrarVentaOffline = useCallback(
    async (venta: VentaOfflineRegistro) => {
      await guardarVentaOffline(venta)
      await refrescarPendientes()
    },
    [refrescarPendientes]
  )

  const sincronizarCola = useCallback(async () => {
    if (sincronizandoRef.current) return
    sincronizandoRef.current = true
    setSincronizando(true)
    setErrorSync(null)

    try {
      const pendientes = await obtenerVentasPendientes()
      if (pendientes.length === 0) {
        setSincronizando(false)
        sincronizandoRef.current = false
        return
      }

      const totalLote = pendientes.length
      setProgreso(`Sincronizando ${totalLote} ${totalLote === 1 ? 'venta' : 'ventas'} en cola...`)

      // Se agrupa por terminal y turno (CA-10-05), lotes de hasta 50
      const lotesMap = new Map<string, VentaOfflineRegistro[]>()
      for (const v of pendientes) {
        const key = `${v.terminalPos}|${v.turnoId}`
        const arr = lotesMap.get(key) || []
        arr.push(v)
        lotesMap.set(key, arr)
      }

      let procesados = 0

      for (const [, ventasGrupo] of lotesMap.entries()) {
        // Enviar en bloques de máximo 50
        for (let i = 0; i < ventasGrupo.length; i += 50) {
          const bloque = ventasGrupo.slice(i, i + 50)
          const primera = bloque[0]

          setProgreso(`Sincronizando ${procesados + 1}/${totalLote}...`)

          try {
            const respuesta = await sincronizarLoteContingencia({
              terminalPos: primera.terminalPos,
              turnoId: primera.turnoId,
              lote: bloque.map((b) => ({
                ventaLocalUuid: b.ventaLocalUuid,
                correlativoContingencia: b.correlativoContingencia,
                fechaHoraOffline: b.fechaHoraOffline,
                items: b.items,
                totalNeto: b.totalNeto,
                efectivoRecibido: b.efectivoRecibido,
                vuelto: b.vuelto,
                clienteId: b.clienteId,
                hashIntegridad: b.hashIntegridad,
              })),
            })

            // Actualizar registros locales según resultados
            for (const res of respuesta.resultados) {
              await actualizarEstadoVentaOffline(
                res.ventaLocalUuid,
                res.estado === 'RESINCRONIZADO' || res.estado === 'DUPLICADO'
                  ? 'RESINCRONIZADO'
                  : res.estado === 'RECHAZADO'
                    ? 'RECHAZADO'
                    : 'REQUIERE_REVISION',
                res.pedidoId,
                res.comprobante,
                res.motivo
              )
            }

            procesados += bloque.length
          } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : 'Error al conectar con Retail'
            setErrorSync(`Fallo en el envío: ${mensaje}`)
            break
          }
        }
      }

      await refrescarPendientes()
      const restantes = await contarVentasPendientes()

      if (restantes === 0) {
        setMensajeExito('Sincronización completada con éxito. Todas las ventas fueron registradas.')
        setTimeout(() => setMensajeExito(null), 5000)
      } else {
        setProgreso(null)
      }
    } finally {
      setSincronizando(false)
      sincronizandoRef.current = false
      setProgreso(null)
    }
  }, [refrescarPendientes])

  // Detección de reconexión para disparo automático (RF-28 / CA-10-01)
  useEffect(() => {
    if (!enLinea) {
      eraOfflineRef.current = true
    } else if (eraOfflineRef.current && enLinea) {
      eraOfflineRef.current = false
      void sincronizarCola()
    }
  }, [enLinea, sincronizarCola])

  return (
    <ContingenciaContext.Provider
      value={{
        enLinea,
        pendientesCount,
        sincronizando,
        progreso,
        mensajeExito,
        errorSync,
        registrarVentaOffline,
        sincronizarCola,
        refrescarPendientes,
      }}
    >
      {children}
    </ContingenciaContext.Provider>
  )
}

export function useContingencia(): ContingenciaContextType {
  const ctx = useContext(ContingenciaContext)
  if (!ctx) {
    throw new Error('useContingencia debe ser usado dentro de ContingenciaProvider')
  }
  return ctx
}
