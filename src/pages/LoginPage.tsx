import { Navigate } from 'react-router-dom'
import { Alert } from '../components/molecules/Alert'
import { LoginForm } from '../components/organisms/LoginForm'
import { AuthLayout } from '../components/templates/AuthLayout'
import { USE_MOCKS } from '../api/http'
import { useAuthStore } from '../store/auth'

export function LoginPage() {
  const token = useAuthStore((s) => s.token)
  const aviso = useAuthStore((s) => s.aviso)
  if (token) return <Navigate to="/pos" replace />

  return (
    <AuthLayout>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[32px] leading-10 font-bold uppercase">Inicia tu turno</h1>
        <p className="text-text-secondary">Ingresa con tu cuenta de personal de tienda.</p>
      </div>
      {aviso && <Alert tono="error">{aviso}</Alert>}
      <LoginForm />
      {USE_MOCKS && (
        <Alert tono="info" title="Modo demostración (API simulada)">
          <p>
            Usuarios: <code>vendedor1@inkaathletics.pe</code>, <code>cajero1@inkaathletics.pe</code>,{' '}
            <code>supervisor1@inkaathletics.pe</code>
          </p>
          <p>
            Contraseña: <code>Retail2026!</code>
          </p>
        </Alert>
      )}
    </AuthLayout>
  )
}
