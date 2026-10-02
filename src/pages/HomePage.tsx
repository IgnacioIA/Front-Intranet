import { useSession } from '../features/auth/session/useSession'
import styles from './HomePage.module.css'

export function HomePage() {
  const { session } = useSession()

  if (session.status !== 'authenticated') {
    return null
  }

  const { user } = session

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Hola, {user.displayName}</h1>
      <p className={styles.subtitle}>Bienvenido a la Intranet Laucom.</p>

      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt>Usuario</dt>
          <dd>{user.username}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Proveedor</dt>
          <dd>{user.provider}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Estado</dt>
          <dd>{user.status}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Roles</dt>
          <dd>{user.roles.join(', ') || '—'}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Permisos</dt>
          <dd>{user.permissions.join(', ') || '—'}</dd>
        </div>
      </dl>
    </section>
  )
}
