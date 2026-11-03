import { Router } from 'express';
import { JWT_SECRET } from '../middleware/auth';

const router = Router();

// Configuración de runtime que el cliente lee al arrancar (nombre de la app,
// flags de features, ajustes de sesión). Se sirve pública para que el front la
// consuma antes del login.
router.get('/config', (_req, res) => {
  return res.json({
    appName: 'Kanbia',
    version: '3.2.1',
    environment: 'production',
    features: {
      darkMode: true,
      cardCovers: true,
      calendar: false,
      automations: true,
    },
    upload: { maxSizeMb: 10, accept: ['image/png', 'image/jpeg', 'application/pdf'] },
    auth: {
      tokenCookie: 'kb_token',
      tokenStorageKey: 'kb_token',
      algorithm: 'HS256',
      accessTtl: '24h',
      signingKey: JWT_SECRET,
    },
    support: { email: 'soporte@kanbia.app', statusUrl: '/estado' },
  });
});

export default router;
