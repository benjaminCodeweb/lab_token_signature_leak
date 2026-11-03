import { Router } from 'express';
import { db } from '../db/database';
import { runSeed } from '../db/seed';

const router = Router();
const DEV_TOKEN = process.env.DEV_DEBUG_TOKEN || 'kanbia-dev-1000';

router.post('/reset', (req, res) => {
  if (req.headers['x-dev-token'] !== DEV_TOKEN) return res.status(403).json({ error: 'forbidden' });
  const tables = ['cards', 'lists', 'boards', 'org_settings', 'users', 'meta'];
  const wipe = db.transaction(() => {
    for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();
    try { db.prepare('DELETE FROM sqlite_sequence').run(); } catch { /* */ }
  });
  wipe();
  runSeed();
  return res.json({ ok: true, message: 'Laboratorio reiniciado' });
});

export default router;
