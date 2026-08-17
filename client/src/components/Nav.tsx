import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo-with-text.png'
import { useAuth } from '../context/AuthContext'
import { Icon } from './Icon'
import styles from './Nav.module.css'

export function Nav() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logoLink}>
        <img src={logo} alt="Tessera" className={styles.logo} />
      </Link>
      <div className={styles.links}>
        {user ? (
          <>
            <button type="button" className={styles.signOut} onClick={signOut}>
              Sair
            </button>
          </>
        ) : (
          <Link to="/entrar" state={{ from: location.pathname }}>
            Entrar
          </Link>
        )}
        <div className={styles.avatar}>
          <Icon name="person" size={20} color="var(--color-primary)" />
        </div>
      </div>
    </nav>
  )
}
