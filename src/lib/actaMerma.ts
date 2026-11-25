/**
 * Reglas de la pantalla del acta de merma (F12 · RF-34).
 *
 * El backend vuelve a validar igual; aquí se valida antes de enviar para que el supervisor vea el
 * motivo sin esperar al servidor.
 */
import type { TipoDestino, TipoFalla } from '../api/actasMermaApi'

export const DESTINOS: { valor: TipoDestino; etiqueta: string }[] = [
  { valor: 'DEVOLUCION_CENTRAL', etiqueta: 'Devolución a almacén central por garantía' },
  { valor: 'BAJA_DEFINITIVA', etiqueta: 'Baja por deterioro o merma irrecuperable' },
  { valor: 'AJUSTE_PERDIDA', etiqueta: 'Ajuste por faltante o pérdida' },
]

export const ETIQUETA_FALLA: Record<TipoFalla, string> = {
  MANCHADO_PROBADOR: 'Prenda manchada en probador',
  COSTURA_ROTA: 'Costura o tela dañada',
  EXTRAVIO_NO_UBICADO: 'Extraviada o no ubicada',
  DEFECTO_FABRICA: 'Falla de confección',
}

export const etiquetaDestino = (destino: TipoDestino) =>
  DESTINOS.find((d) => d.valor === destino)?.etiqueta ?? destino

/** Mensaje que impide emitir el acta, o `null` si se puede emitir. CA-RF34-04: lista vacía. */
export function motivoParaNoEmitir(seleccionadas: string[], destino: TipoDestino | null): string | null {
  if (seleccionadas.length === 0) return 'Selecciona al menos una prenda en cuarentena para emitir el acta.'
  if (!destino) return 'Elige el destino de las prendas.'
  return null
}
