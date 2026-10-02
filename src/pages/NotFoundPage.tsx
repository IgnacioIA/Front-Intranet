import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.code}>404</h1>
      <h2>Página no encontrada</h2>
      <p>La página que estás buscando no existe.</p>
      <Link to="/" className={`btn-primary ${styles.link}`}>
        Volver al inicio
      </Link>
    </section>
  )
}
