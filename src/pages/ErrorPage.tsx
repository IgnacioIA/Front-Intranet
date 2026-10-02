import { Link, useRouteError } from 'react-router-dom'
import styles from './ErrorPage.module.css'

export function ErrorPage() {
  const error = useRouteError()

  if (import.meta.env.DEV) {
    console.error(error)
  }

  return (
    <section className={styles.page}>
      <h1>Algo salió mal</h1>
      <p>Ocurrió un error inesperado. Intentá volver al inicio.</p>
      <Link to="/" className="btn-primary">
        Volver al inicio
      </Link>
    </section>
  )
}
