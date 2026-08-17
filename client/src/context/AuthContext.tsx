import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../services/supabase'

export type UserRole = 'organizer' | 'customer' | 'gate_staff'

interface AuthUser {
  id: string
  email: string
  role: UserRole
  name: string
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function decodeJwt(token: string): Record<string, unknown> {
  const payload = token.split('.')[1]
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  )
  return JSON.parse(json)
}

function toAuthUser(accessToken: string): AuthUser {
  const claims = decodeJwt(accessToken) as {
    sub: string
    email: string
    user_role: UserRole
    user_metadata?: { name?: string }
  }

  return {
    id: claims.sub,
    email: claims.email,
    role: claims.user_role,
    name: claims.user_metadata?.name ?? claims.email,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session ? toAuthUser(data.session.access_token) : null)
      setAccessToken(data.session?.access_token ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? toAuthUser(session.access_token) : null)
      setAccessToken(session?.access_token ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    if (!supabase) throw new Error('autenticação não configurada')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, name: string) {
    if (!supabase) throw new Error('autenticação não configurada')
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    if (error) throw error
  }

  async function signOut() {
    await supabase?.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
