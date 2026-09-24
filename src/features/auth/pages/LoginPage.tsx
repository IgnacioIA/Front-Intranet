import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ApiError } from '../../../shared/http/ApiError'
import { useSession } from '../session/useSession'
import { LoginForm } from '../components/LoginForm'

function describeLoginError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Usuario o contraseña incorrectos.'
    if (error.status === 429) return 'Demasiados intentos. Intente nuevamente más tarde.'
  }
  return 'No se pudo iniciar sesión. Intente nuevamente.'
}

export function LoginPage() {
  const { session, login } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (session.status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(credentials: { username: string; password: string }) {
    setSubmitting(true)
    setErrorMessage(null)
    try {
      await login(credentials)
    } catch (error) {
      setErrorMessage(describeLoginError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <h1>Laucom</h1>
      <LoginForm submitting={submitting} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </main>
  )
}
