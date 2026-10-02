import logoSrc from '../../assets/logo/LogoLaucom.png'
import styles from './Logo.module.css'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src={logoSrc}
      alt="Laucom"
      className={className ? `${styles.logo} ${className}` : styles.logo}
    />
  )
}
