import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import styles from './AuthenticatedLayout.module.css'

export function AuthenticatedLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={styles.layout}>
      <Header onMenuClick={() => setMenuOpen(true)} />
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
