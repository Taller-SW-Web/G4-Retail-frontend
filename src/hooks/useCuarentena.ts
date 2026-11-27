import { useCallback, useEffect, useMemo, useState } from 'react'
import { listarCuarentena, type ItemCuarentena } from '../api/inventarioApi'

/**
 * Bandeja de cuarentena de la tienda (F12 · RF-33), en el estado local de quien la usa.
 *
 * Devuelve también los SKU bloqueados para aplicarlos al catálogo. Si la consulta falla, la bandeja
 * queda vacía con su error: el POS sigue vendiendo y el backend rechaza igual la prenda bloqueada.
 */
export function useCuarentena() {
  const [items, setItems] = useState<ItemCuarentena[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    setCargando(true)
    try {
      setItems(await listarCuarentena())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar la cuarentena')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  const skus = useMemo(() => new Set(items.map((item) => item.sku)), [items])

  return { items, skus, cargando, error, recargar }
}
