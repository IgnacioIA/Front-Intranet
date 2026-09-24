import { useSession } from './features/auth/session/useSession'

function App() {
  const { session } = useSession()

  if (session.status !== 'authenticated') {
    return null
  }

  const { user } = session

  return (
    <main>
      <h1>Laucom</h1>
      <p>
        Sesión iniciada como {user.displayName} ({user.username}).
      </p>
      <dl>
        <dt>Proveedor</dt>
        <dd>{user.provider}</dd>
        <dt>Estado</dt>
        <dd>{user.status}</dd>
        <dt>Roles</dt>
        <dd>{user.roles.join(', ') || '—'}</dd>
        <dt>Permisos</dt>
        <dd>{user.permissions.join(', ') || '—'}</dd>
      </dl>
    </main>
  )
}

export default App
