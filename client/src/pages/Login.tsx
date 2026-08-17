import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo-with-text.png'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const errors: FieldErrors = {}

    if (mode === 'signup' && !name.trim()) {
      errors.name = 'Digite seu nome.'
    }
    if (!EMAIL_PATTERN.test(email)) {
      errors.email = 'Digite um email válido.'
    }
    if (password.length < 6) {
      errors.password = 'A senha precisa ter pelo menos 6 caracteres.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!validate()) return

    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, name)
      }
      navigate(redirectTo)
    } catch {
      setFormError(mode === 'signin' ? 'Email ou senha incorretos.' : 'Não foi possível criar a conta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.logoLink}>
        <img src={logo} alt="Tessera" className={styles.logo} />
      </Link>

      <div className={styles.center}>
        <div className={styles.card}>
          <h1 className={styles.title}>{mode === 'signin' ? 'Entrar' : 'Criar conta'}</h1>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {mode === 'signup' && (
              <label className={styles.field}>
                Nome
                <input value={name} onChange={(event) => setName(event.target.value)} />
                {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
              </label>
            )}

            <label className={styles.field}>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
            </label>

            <label className={styles.field}>
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
            </label>

            {formError && <p className={styles.error}>{formError}</p>}

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? 'Enviando...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <button
            type="button"
            className={styles.toggle}
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setFieldErrors({})
              setFormError(null)
            }}
          >
            {mode === 'signin' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
