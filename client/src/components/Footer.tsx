import { Link } from 'react-router-dom'
import logo from '../assets/logo-with-text.png'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Link to="/" className={styles.logoLink}>
        <img src={logo} alt="Tessera" className={styles.logo} />
      </Link>

      <p className={styles.copyright}>© {new Date().getFullYear()} Tessera. Todos os direitos reservados.</p>
    </footer>
  )
}
