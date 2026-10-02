import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const links = [
  { to: '/contactos', label: 'Contactos' },
  { to: '/comunicados', label: 'Comunicados' },
  { to: '/archivos', label: 'Archivos' },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={open ? `${styles.backdrop} ${styles.backdropOpen}` : styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        className={open ? `${styles.drawer} ${styles.drawerOpen}` : styles.drawer}
        aria-label="Menú principal"
      >
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Menú</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>
        <ul className={styles.list}>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.linkActive}` : styles.link
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
