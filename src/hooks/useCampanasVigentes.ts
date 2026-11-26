import { useEffect, useState } from 'react'
import { listarCampanasVigentes, type CampanaVigente } from '../api/controlApi'

/** El backend guarda las campañas 15 minutos en caché (contrato §5.11): no tiene sentido pedirlas antes. */
const INTERVALO_CAMPANAS_MS = 15 * 60_000

/**
 * F11 · RF-31: campañas vigentes del canal RETAIL para la tira de promociones del POS.
 *
 * Si Productos no responde, la tira simplemente no aparece: una promoción no es motivo para
 * interrumpir la venta.
 */
export function useCampanasVigentes(): CampanaVigente[] {
  const [campanas, setCampanas] = useState<CampanaVigente[]>([])

  useEffect(() => {
    let vigente = true
    const cargar = () =>
      listarCampanasVigentes()
        .then((lista) => vigente && setCampanas(lista))
        .catch(() => vigente && setCampanas([]))
    void cargar()
    const intervalo = setInterval(() => void cargar(), INTERVALO_CAMPANAS_MS)
    return () => {
      vigente = false
      clearInterval(intervalo)
    }
  }, [])

  return campanas
}
