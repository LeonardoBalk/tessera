import type { NextFunction, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export type UserRole = 'organizer' | 'customer' | 'gate_staff'

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole }
    }
  }
}

const jwks = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
)

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'missing authorization token' })
    return
  }

  try {
    const { payload } = await jwtVerify(token, jwks)
    req.auth = { userId: payload.sub as string, role: payload.user_role as UserRole }
    next()
  } catch {
    res.status(401).json({ error: 'invalid or expired token' })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'insufficient role' })
      return
    }
    next()
  }
}
