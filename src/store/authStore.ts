/**
 * Estado global de la sesión del vendedor (F1).
 *
 * Es uno de los tres estados que `AGENTS.md` autoriza a vivir en el store global, junto con el
 * turno de caja y el carrito. Lo que el usuario escribe en el formulario de login no entra aquí:
 * eso es estado local de la pantalla.
 */
import { create } from 'zustand'
import { ApiError, definirToken, registrarPerdidaDeSesion } from '../api/http'
import { iniciarSesion, nombreDelToken, obtenerPerfil, type Perfil } from '../api/seguridad'
import { tokenVigente } from '../lib/token'

const CLAVE_TOKEN = 'retail.token'

interface EstadoAuth {
  token: string | null
  perfil: Perfil | null
  nombre: string | null
  cargando: boolean
  error: string | null
  /**
   * True mientras se valida contra el backend un token guardado de una sesión anterior. Las rutas
   * protegidas esperan en vez de redirigir: si no, recargar /pickup llevaría al login y de ahí al
   * mostrador, aunque la sesión fuera válida.
   */
  restaurando: boolean
  /** Hay token, hay perfil y el token no venció. */
  autenticado: () => boolean
  entrar: (correo: string, clave: string) => Promise<boolean>
  restaurarSesion: () => Promise<void>
  salir: () => void
}

/** El token sobrevive a una recarga: un vendedor no debería reloguearse por refrescar la página. */
function leerTokenGuardado(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

function guardarToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(CLAVE_TOKEN, token)
    else window.localStorage.removeItem(CLAVE_TOKEN)
  } catch {
    // Modo privado o almacenamiento bloqueado: la sesión sigue viva en memoria.
  }
}

export const useAuthStore = create<EstadoAuth>((set, get) => ({
  token: null,
  perfil: null,
  nombre: null,
  cargando: false,
  error: null,
  restaurando: leerTokenGuardado() !== null,

  autenticado: () => {
    const { token, perfil } = get()
    return token !== null && perfil !== null && tokenVigente(token)
  },

  async entrar(correo, clave) {
    set({ cargando: true, error: null })
    try {
      const sesion = await iniciarSesion(correo, clave)
      definirToken(sesion.accessToken)

      // El perfil decide qué puede hacer en mostrador, así que la sesión no está completa sin él.
      const perfil = await obtenerPerfil()
      guardarToken(sesion.accessToken)

      set({
        token: sesion.accessToken,
        perfil,
        nombre: nombreDelToken(sesion.accessToken),
        cargando: false,
      })
      return true
    } catch (error) {
      definirToken(null)
      set({ token: null, perfil: null, nombre: null, cargando: false, error: mensajeDe(error) })
      return false
    }
  },

  async restaurarSesion() {
    const token = leerTokenGuardado()
    if (!token || !tokenVigente(token)) {
      // Nada que restaurar, o un token que ya venció: no vale la pena preguntarle al backend.
      if (token) get().salir()
      set({ restaurando: false })
      return
    }

    set({ restaurando: true })
    definirToken(token)
    try {
      const perfil = await obtenerPerfil()
      set({ token, perfil, nombre: nombreDelToken(token) })
    } catch {
      // Token revocado o backend que lo rechaza: se limpia en silencio y la app pide login otra vez.
      get().salir()
    } finally {
      set({ restaurando: false })
    }
  },

  salir() {
    definirToken(null)
    guardarToken(null)
    set({ token: null, perfil: null, nombre: null, error: null })
  },
}))

/** Si el backend responde 401 en cualquier llamada, la sesión se cierra sola. */
registrarPerdidaDeSesion(() => useAuthStore.getState().salir())

function mensajeDe(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.sinConexion) return 'No se pudo contactar al servidor. Revisa tu conexión.'
    if (error.status === 401) return 'El correo o la contraseña no son correctos.'
    if (error.codigo === 'FORBIDDEN_USUARIO_SIN_TIENDA') {
      return 'Tu usuario no está habilitado para operar en esta tienda.'
    }
    return error.message
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
