import { Router } from 'express';
import { db } from '../db/database';
import { requireAuth } from '../middleware/auth';
import { findUserById, memberCard } from '../util';

const router = Router();

const assignee = (id: number | null) => (id ? memberCard(findUserById(id)!) : null);

// ── LISTADO DE TABLEROS ──────────────────────────────────────────────────────
router.get('/boards', requireAuth, (_req, res) => {
  const boards = db.prepare('SELECT * FROM boards ORDER BY id').all() as any[];
  const items = boards.map((b) => {
    const cards = db.prepare('SELECT COUNT(*) c FROM cards cd JOIN lists l ON l.id=cd.list_id WHERE l.board_id=?').get(b.id) as any;
    return { id: b.id, name: b.name, color: b.color, cards: cards.c };
  });
  return res.json({ items });
});

// ── DETALLE DE UN TABLERO (listas + tarjetas) ────────────────────────────────
router.get('/boards/:id', requireAuth, (req, res) => {
  const b = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id) as any;
  if (!b) return res.status(404).json({ error: 'Tablero no encontrado' });
  const lists = db.prepare('SELECT * FROM lists WHERE board_id = ? ORDER BY pos, id').all(b.id) as any[];
  const withCards = lists.map((l) => {
    const cards = (db.prepare('SELECT * FROM cards WHERE list_id = ? ORDER BY pos, id').all(l.id) as any[]).map((c) => ({
      id: c.id, title: c.title, description: c.description, labels: c.labels ? c.labels.split(',') : [],
      due: c.due, assignee: assignee(c.assignee_id),
    }));
    return { id: l.id, name: l.name, cards };
  });
  return res.json({ id: b.id, name: b.name, color: b.color, lists: withCards });
});

// ── CREAR / MOVER TARJETA (features reales) ──────────────────────────────────
router.post('/boards/:id/cards', requireAuth, (req, res) => {
  const listId = Number(req.body?.list_id);
  const title = String(req.body?.title ?? '').trim();
  const list = db.prepare('SELECT * FROM lists WHERE id = ? AND board_id = ?').get(listId, req.params.id) as any;
  if (!list || !title) return res.status(400).json({ error: 'Datos incompletos' });
  const pos = (db.prepare('SELECT COALESCE(MAX(pos),0)+1 p FROM cards WHERE list_id=?').get(listId) as any).p;
  const r = db.prepare('INSERT INTO cards (list_id, title, pos, assignee_id) VALUES (?, ?, ?, ?)').run(listId, title, pos, req.user!.id);
  const c = db.prepare('SELECT * FROM cards WHERE id = ?').get(Number(r.lastInsertRowid)) as any;
  return res.json({ ok: true, card: { id: c.id, title: c.title, description: '', labels: [], due: null, assignee: assignee(c.assignee_id) } });
});

router.post('/cards/:id/move', requireAuth, (req, res) => {
  const listId = Number(req.body?.list_id);
  const list = db.prepare('SELECT 1 FROM lists WHERE id = ?').get(listId);
  if (!list) return res.status(400).json({ error: 'Lista no válida' });
  db.prepare('UPDATE cards SET list_id = ? WHERE id = ?').run(listId, req.params.id);
  return res.json({ ok: true });
});

export default router;
