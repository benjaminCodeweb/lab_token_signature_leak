import { Router } from 'express';
import { db } from '../db/database';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { memberCard, DbUser } from '../util';
import { FLAG } from '../flag';

const router = Router();

// Miembros de la organización — visible para cualquier usuario (pestaña Miembros).
router.get('/org/members', requireAuth, (_req, res) => {
  const users = db.prepare("SELECT * FROM users ORDER BY (role='admin') DESC, id").all() as DbUser[];
  return res.json({ items: users.map(memberCard) });
});

// Ajustes de la organización — SOLO administradores. Incluye la clave maestra
// (secreto de la organización): la flag.
router.get('/org/settings', requireAdmin, (_req, res) => {
  const setting = (k: string, d = '') => (db.prepare('SELECT value FROM org_settings WHERE key = ?').get(k) as any)?.value ?? d;
  return res.json({
    orgName: setting('org_name', 'Kanbia'),
    plan: setting('plan', 'Business'),
    seats: Number(setting('seats', '25')),
    billingEmail: setting('billing_email', 'facturacion@kanbia.app'),
    ssoDomain: setting('sso_domain', 'kanbia.app'),
    createdAt: setting('created_at', '2024-03-01'),
    // Clave maestra de la organización (rota API keys, SCIM, exports). Secreta.
    masterKey: FLAG,
  });
});

export default router;
