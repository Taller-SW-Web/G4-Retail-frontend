/**
 * Mock del módulo Seguridad (G7).
 *
 * Retail no emite tokens ni valida contraseñas: eso es exclusivo de Seguridad. Mientras ese módulo
 * no esté disponible, este mock ocupa su lugar y devuelve un token ya firmado para los vendedores
 * semilla.
 *
 * Los tokens son JWT generados por el backend con la clave compartida de desarrollo, no se firman
 * aquí: la clave nunca viaja al navegador. El backend valida su firma de verdad, así que si se
 * altera un carácter, la petición se rechaza con 401.
 *
 * Cuando G7 esté arriba, se apaga con `VITE_USE_MOCKS=false` y la pantalla de login llama a
 * `POST /api/v1/auth/login` real. Nada más cambia.
 */
import { ApiError } from '../http'

export interface RespuestaLogin {
  accessToken: string
  tokenType: 'Bearer'
  /** Segundos de vigencia del token. */
  expiresIn: number
}

interface UsuarioSemilla {
  correo: string
  clave: string
  token: string
}

/** Los dos usuarios que pide la sección 6 del contrato: un vendedor y un supervisor. */
const USUARIOS_SEMILLA: UsuarioSemilla[] = [
  {
    correo: 'vendedor1@inkaathletics.pe',
    clave: 'Retail2026!',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYmJiYmJiYi0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJ0aXBvIjoiYWNjZXNvIiwibm9tYnJlIjoiTHVjaWEgUmFtaXJleiBWZWdhIiwiaXNzIjoiaHR0cHM6Ly9zZWd1cmlkYWQuZzQvbW9jayIsImlhdCI6MTc5MjE4NTE2NCwiZXhwIjoxNzk0Nzc3MTY0fQ.toWybfZYm6fZzhhtxKOwKMI1wP-w4kuEyLuxnSp8Fq4',
  },
  {
    correo: 'supervisor1@inkaathletics.pe',
    clave: 'Retail2026!',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYmJiYmJiYi0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDQiLCJ0aXBvIjoiYWNjZXNvIiwibm9tYnJlIjoiSm9yZ2UgU2FsYXphciBNZW5kb3phIiwiaXNzIjoiaHR0cHM6Ly9zZWd1cmlkYWQuZzQvbW9jayIsImlhdCI6MTc5MjE4NTE2NCwiZXhwIjoxNzk0Nzc3MTY0fQ.K1ggXZjaFfZWdnRXSXGu0Du-T5z4jOe72mJ3cgpmAg8',
  },
]

/** Demora corta para que la pantalla muestre su estado de carga, como haría el servicio real. */
const DEMORA_MS = 350

export async function loginSimulado(correo: string, clave: string): Promise<RespuestaLogin> {
  await new Promise((resolver) => setTimeout(resolver, DEMORA_MS))

  const usuario = USUARIOS_SEMILLA.find(
    (candidato) => candidato.correo === correo.trim().toLowerCase() && candidato.clave === clave,
  )

  if (!usuario) {
    throw new ApiError(401, {
      code: 'CREDENCIALES_INVALIDAS',
      title: 'No autenticado',
      detail: 'El correo o la contraseña no son correctos',
    })
  }

  return { accessToken: usuario.token, tokenType: 'Bearer', expiresIn: 60 * 60 * 24 * 30 }
}
