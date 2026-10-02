import styles from './PlaceholderPage.module.css'

interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className={styles.page}>
      <h1>{title}</h1>
      <p>Módulo en construcción.</p>
    </section>
  )
}
