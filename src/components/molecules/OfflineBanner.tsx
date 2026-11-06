import { useEstadoConexion } from '../../hooks/useEstadoConexion'
import Alert from './Alert'

export default function OfflineBanner() {
  const enLinea = useEstadoConexion()
  if (enLinea) return null

  return (
    <Alert tono="warning" title="Sin conexión con Retail" className="mx-auto mt-4 max-w-7xl">
      Espera a que se restablezca la conexión antes de confirmar el cobro.
    </Alert>
  )
}
