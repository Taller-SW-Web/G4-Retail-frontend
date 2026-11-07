import { useEffect, useState } from 'react'
import { listarCatalogo } from '../api/catalogoApi'
import { lineasVendibles } from '../lib/catalog'
import { loadCart } from '../lib/cartStorage'
import { guardarCatalogoCache, obtenerCatalogoCache } from '../lib/offlineStorage'
import { useCartStore } from '../store/cart'
import type { Product } from '../types'

async function cargarCatalogo(): Promise<Product[]> {
  try {
    const catalogo = await listarCatalogo()
    // F10: copia local del catálogo para operar en contingencia offline (CA-10-03)
    void guardarCatalogoCache(catalogo)
    return catalogo
  } catch {
    return (await obtenerCatalogoCache()) ?? []
  }
}

/** Recupera el carrito guardado en el navegador si no hay una venta en curso. */
function recuperarCarrito(catalogo: Product[]) {
  if (useCartStore.getState().items.length > 0) return
  const inicial = loadCart(lineasVendibles(catalogo), window.localStorage)
  if (inicial.length > 0) useCartStore.getState().cargarCarrito(inicial)
}

/**
 * F2: catálogo de la tienda desde Retail (contrato §5.2), con los mismos SKU que valida la venta.
 * Se consulta solo con sesión; sin conexión usa la última copia local.
 */
export function useCatalogoTienda(autenticado: boolean): Product[] {
  const [productos, setProductos] = useState<Product[]>([])

  useEffect(() => {
    if (!autenticado) return
    let vigente = true
    void cargarCatalogo().then((catalogo) => {
      if (!vigente) return
      setProductos(catalogo)
      recuperarCarrito(catalogo)
    })
    return () => {
      vigente = false
    }
  }, [autenticado])

  return productos
}
