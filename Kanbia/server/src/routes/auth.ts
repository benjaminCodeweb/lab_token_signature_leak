import { Router } from 'express';
import { db } from '../db/database';
import { signToken, requireAuth } from '../middleware/auth';
import { findUserByEmail, findUserById, publicUser, DbUser } from '../util';

const router = Router();

function issue(res: any, u: DbUser) {
  const token = signToken({ id: u.id, email: u.email, role: u.role as 'member' | 'admin', display_name: u.display_name });
  res.cookie('kb_token', token, { httpOnly: false, sameSite: 'lax', maxAge: 86400_000 });
  return { token, user: publicUser(u) };
}

router.post('/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const u = findUserByEmail(email);
  if (!u || u.password !== password) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  return res.json(issue(res, u));
});

router.post('/register', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const name = String(req.body?.display_name ?? '').trim() || email.split('@')[0];
  if (!email.includes('@') || password.length < 4) return res.status(400).json({ error: 'Datos de registro incompletos' });
  if (findUserByEmail(email)) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
  const colors = ['#0079bf', '#d29034', '#519839', '#b04632', '#89609e', '#cd5a91'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const r = db.prepare("INSERT INTO users (email, password, display_name, role, avatar_color) VALUES (?, ?, ?, 'member', ?)").run(email, password, name, color);
  return res.json(issue(res, findUserById(Number(r.lastInsertRowid))!));
});

router.get('/me', requireAuth, (req, res) => {
  const u = findUserById(req.user!.id);
  if (!u) return res.status(404).json({ error: 'no existe' });
  return res.json({ user: publicUser(u) });
});

router.post('/logout', (_req, res) => { res.clearCookie('kb_token'); return res.json({ ok: true }); });

export default router;
