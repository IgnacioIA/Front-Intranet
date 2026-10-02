import { Link } from 'react-router-dom'
import { useSession } from '../../features/auth/session/useSession'
import { Logo } from '../../shared/ui/Logo'
import styles from './Header.module.css'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { session } = useSession()
  const displayName = session.status === 'authenticated' ? session.user.displayName : ''

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menuButton}
        onClick={onMenuClick}
        aria-label="Abrir menú"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M3 6h18M3 12h18M3 18h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>

      <Link to="/" className={styles.logoLink} aria-label="Ir al inicio">
        <Logo />
      </Link>

      <span className={styles.user}>{displayName}</span>
    </header>
  )
}
