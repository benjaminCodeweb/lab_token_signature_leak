import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Clave de firma del servicio. En un despliegue real jamás debe salir del
// servidor; aquí se toma de la variable de entorno (con un valor de "dev").
export const JWT_SECRET = process.env.JWT_SECRET || 'kanbia-dev-signing-key-change-in-prod';

export interface AuthUser {
  id: number;
  email: string;
  role: 'member' | 'admin';
  display_name: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  const c = (req as any).cookies?.kb_token;
  if (typeof c === 'string' && c.length) return c;
  return null;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const tok = extractToken(req);
  if (tok) {
    const u = verifyToken(tok);
    if (u) req.user = u;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Sesión no válida o expirada' });
    return;
  }
  next();
}

// El panel de organización es solo para administradores. La comprobación es
// correcta: lee el rol del token verificado. (La debilidad está en otra parte.)
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Sesión no válida o expirada' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Solo los administradores de la organización pueden acceder a esta sección.' });
    return;
  }
  next();
}
