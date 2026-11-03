import crypto from 'crypto';
import { db, setMeta } from './database';

export function runSeed(): void {
  const already = db.prepare('SELECT COUNT(*) c FROM users').get() as { c: number };
  if (already.c > 0) return;

  // ── USUARIOS ──────────────────────────────────────────────────────────────
  const insUser = db.prepare('INSERT INTO users (email, password, display_name, role, avatar_color) VALUES (?, ?, ?, ?, ?)');
  const adminPass = crypto.randomBytes(24).toString('hex');
  setMeta('admin_password', adminPass);
  const admin = Number(insUser.run('sofia.marin@kanbia.local', adminPass, 'Sofía Marín', 'admin', '#b04632').lastInsertRowid);
  const attacker = Number(insUser.run('attacker@kanbia.local', 'password123', 'Alex Río', 'member', '#0079bf').lastInsertRowid);
  const marta = Number(insUser.run('marta.ruano@kanbia.local', 'password123', 'Marta Ruano', 'member', '#519839').lastInsertRowid);
  const diego = Number(insUser.run('diego.fuentes@kanbia.local', 'password123', 'Diego Fuentes', 'member', '#89609e').lastInsertRowid);
  const nora = Number(insUser.run('nora.vidal@kanbia.local', 'password123', 'Nora Vidal', 'member', '#d29034').lastInsertRowid);
  const bruno = Number(insUser.run('bruno.gil@kanbia.local', 'password123', 'Bruno Gil', 'member', '#cd5a91').lastInsertRowid);
  const members = [admin, attacker, marta, diego, nora, bruno];
  const pick = (i: number) => members[i % members.length];

  // ── ORG SETTINGS (metadatos; la clave maestra NO está aquí, la sirve /org/settings) ──
  const setOrg = db.prepare('INSERT INTO org_settings (key, value) VALUES (?, ?)');
  setOrg.run('org_name', 'Nébula Studio');
  setOrg.run('plan', 'Business');
  setOrg.run('seats', '25');
  setOrg.run('billing_email', 'facturacion@nebula.studio');
  setOrg.run('sso_domain', 'nebula.studio');
  setOrg.run('created_at', '2024-03-01');

  // ── TABLEROS / LISTAS / TARJETAS ──────────────────────────────────────────
  const insBoard = db.prepare('INSERT INTO boards (name, color) VALUES (?, ?)');
  const insList = db.prepare('INSERT INTO lists (board_id, name, pos) VALUES (?, ?, ?)');
  const insCard = db.prepare('INSERT INTO cards (list_id, title, description, pos, assignee_id, labels, due, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  let ci = 0;
  const board = (name: string, color: string, lists: { name: string; cards: [string, string?, string?][] }[]) => {
    const bid = Number(insBoard.run(name, color).lastInsertRowid);
    lists.forEach((l, li) => {
      const lid = Number(insList.run(bid, l.name, li).lastInsertRowid);
      l.cards.forEach((c, pos) => {
        insCard.run(lid, c[0], c[2] ?? '', pos, pick(ci++), c[1] ?? '', null, `2026-0${1 + (ci % 3)}-${10 + (ci % 15)} 09:00:00`);
      });
    });
    return bid;
  };

  board('Producto — Roadmap Q1', '#0079bf', [
    { name: 'Backlog', cards: [['Rediseño del onboarding', 'ux'], ['Modo oscuro global', 'ux,frontend'], ['Exportar tableros a CSV'], ['Integración con Slack', 'backend']] },
    { name: 'En curso', cards: [['Buscador de tarjetas', 'frontend', 'Indexar título + descripción; atajo /'], ['API pública v2', 'backend', 'Rate limit por API key']] },
    { name: 'En revisión', cards: [['Migración a Postgres', 'backend'], ['Auditoría de accesibilidad', 'ux']] },
    { name: 'Hecho', cards: [['Notificaciones por email'], ['Papelera de tarjetas'], ['Roles de organización', 'seguridad']] },
  ]);
  board('Marketing — Lanzamiento', '#519839', [
    { name: 'Ideas', cards: [['Vídeo de producto (YouTube)'], ['Caso de éxito: Nébula'], ['Webinar de onboarding']] },
    { name: 'Esta semana', cards: [['Newsletter de febrero', 'copy'], ['Landing de la v3', 'frontend']] },
    { name: 'Publicado', cards: [['Post de blog: novedades'], ['Cambios en precios']] },
  ]);
  board('Contratación — Ingeniería', '#b04632', [
    { name: 'Candidatos', cards: [['Frontend Sr. — 3 CVs'], ['SRE — screening']] },
    { name: 'Entrevistas', cards: [['Backend — técnica jueves']] },
    { name: 'Oferta', cards: [['Diseñador de producto']] },
  ]);

  console.log('[SEED] listo — %d usuarios, %d tableros, %d tarjetas. Admin: sofia.marin@kanbia.local (pass aleatoria) · Atacante: attacker@kanbia.local / password123 (member).',
    (db.prepare('SELECT COUNT(*) c FROM users').get() as any).c,
    (db.prepare('SELECT COUNT(*) c FROM boards').get() as any).c,
    (db.prepare('SELECT COUNT(*) c FROM cards').get() as any).c);
}
