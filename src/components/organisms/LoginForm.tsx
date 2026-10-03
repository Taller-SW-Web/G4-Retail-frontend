import { useState, type FormEvent } from 'react'
import { IconLock, IconLogin2, IconMail } from '@tabler/icons-react'
import { Button } from '../atoms/Button'
import { Select } from '../atoms/Select'
import { Alert } from '../molecules/Alert'
import { FormField } from '../molecules/FormField'
import { ApiError } from '../../api/http'
import { login } from '../../services'
import { useAuthStore } from '../../store/auth'
import { TIENDAS } from '../../lib/empresa'
import { ACCESO_RESTRINGIDO } from '../../lib/permisos'
import { esEmailValido } from '../../lib/validation'

const MIN_PASSWORD = 8

/** RF-01: autenticación del personal de tienda. */
export function LoginForm() {
  const iniciarSesion = useAuthStore((s) => s.iniciarSesion)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tienda, setTienda] = useState(Object.keys(TIENDAS)[0])
  const [tocado, setTocado] = useState({ email: false, password: false })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailValido = esEmailValido(email)
  const passwordValida = password.length >= MIN_PASSWORD

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!emailValido || !passwordValida || cargando) return
    setCargando(true)
    setError(null)
    try {
      const { token, usuario } = await login(email.trim(), password)
      iniciarSesion(token, usuario)
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      setError(
        status === 401 || status === 400
          ? 'Credenciales incorrectas. Verifique su correo y contraseña'
          : status === 403
            ? ACCESO_RESTRINGIDO
            : 'Servicio de autenticación no disponible. Intente nuevamente en unos minutos',
      )
      setCargando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      {error && <Alert tono="error">{error}</Alert>}
      <div className="flex flex-col gap-4">
        <FormField
          label="Correo institucional"
          type="email"
          autoComplete="username"
          autoFocus
          placeholder="vendedor@inkaathletics.pe"
          icon={<IconMail size={20} aria-hidden />}
          value={email}
          disabled={cargando}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTocado((t) => ({ ...t, email: true }))}
          error={(tocado.email || email.includes('@')) && email && !emailValido ? 'Ingrese un correo válido (ej. vendedor@inkaathletics.pe)' : undefined}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          icon={<IconLock size={20} aria-hidden />}
          value={password}
          disabled={cargando}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTocado((t) => ({ ...t, password: true }))}
          error={tocado.password && password && !passwordValida ? `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` : undefined}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="tienda" className="text-sm font-semibold">
            Tienda asignada
          </label>
          <Select id="tienda" value={tienda} disabled={cargando} onChange={(e) => setTienda(e.target.value)}>
            {Object.entries(TIENDAS).map(([id, { nombre }]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Button type="submit" size="lg" fullWidth loading={cargando} disabled={!emailValido || !passwordValida} icon={<IconLogin2 size={20} aria-hidden />}>
        Ingresar a Terminal
      </Button>
    </form>
  )
}
