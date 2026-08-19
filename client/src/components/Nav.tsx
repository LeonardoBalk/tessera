import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo-with-text.png'
import { useAuth } from '../context/AuthContext'
import { Icon } from './Icon'
import styles from './Nav.module.css'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function Nav() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logoLink}>
        <img src={logo} alt="Tessera" className={styles.logo} />
      </Link>
      <div className={styles.links}>
        {user ? (
          <>
            {user.role === 'customer' && (
              <Link to="/ingressos" className={styles.navLink}>
                <Icon name="confirmation_number" size={18} color="currentColor" />
                Meus ingressos
              </Link>
            )}
            {user.role === 'gate_staff' && (
              <Link to="/portaria" className={styles.navLink}>
                <Icon name="qr_code_scanner" size={18} color="currentColor" />
                Portaria
              </Link>
            )}
            <div className={styles.menuWrapper} ref={menuRef}>
              <button
                type="button"
                className={styles.avatar}
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
              >
                {getInitials(user.name)}
              </button>
              {menuOpen && (
                <div className={styles.menuPanel}>
                  <div className={styles.menuName}>{user.name}</div>
                  <div className={styles.menuEmail}>{user.email}</div>
                  <button type="button" className={styles.menuSignOut} onClick={signOut}>
                    Sair
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/entrar" state={{ from: location.pathname }}>
            Entrar
          </Link>
        )}
      </div>
    </nav>
  )
}
