import type { Product, Variant } from '../types'

/** Alerta que exige la spec de F12 al intentar vender una prenda bloqueada (CA-RF33-02). */
export const MENSAJE_BLOQUEO = 'PRODUCTO BLOQUEADO POR CUARENTENA'

const bloquearVariante = (variante: Variant): Variant => ({ ...variante, enCuarentena: true, stock: 0 })

/**
 * Marca en el catálogo las prendas en cuarentena de la tienda (RF-33).
 *
 * El backend ya envía `enCuarentena` en cada variante, pero el catálogo se carga una vez por sesión:
 * esta función aplica además la bandeja recién consultada, para que una prenda que se acaba de
 * reportar quede bloqueada en el POS sin recargar la página.
 */
export function aplicarCuarentena(productos: Product[], skus: ReadonlySet<string>): Product[] {
  if (skus.size === 0) return productos
  return productos.map((producto) => {
    if (!producto.variants?.length) {
      return skus.has(producto.id) ? { ...producto, enCuarentena: true, stock: 0 } : producto
    }
    if (!producto.variants.some((v) => skus.has(v.sku))) return producto
    const variants = producto.variants.map((v) => (skus.has(v.sku) ? bloquearVariante(v) : v))
    return { ...producto, variants, stock: variants.reduce((suma, v) => suma + v.stock, 0) }
  })
}

/** Si la prenda concreta (la variante, o el artículo de talla única) está bloqueada. */
export const estaEnCuarentena = (producto: Product, variante?: Variant): boolean =>
  Boolean(variante ? variante.enCuarentena : producto.enCuarentena)

/**
 * Pitido corto de error del lector (spec F12, RF-33). Si el navegador no tiene audio (pruebas,
 * políticas de autoplay), no hace nada: la alerta visual es la que manda.
 */
export function sonarError(): void {
  try {
    const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Contexto) return
    const audio = new Contexto()
    const oscilador = audio.createOscillator()
    oscilador.type = 'square'
    oscilador.frequency.value = 220
    oscilador.connect(audio.destination)
    oscilador.start()
    oscilador.stop(audio.currentTime + 0.25)
    oscilador.onended = () => void audio.close()
  } catch {
    // Sin audio disponible: no es un error del mostrador.
  }
}
