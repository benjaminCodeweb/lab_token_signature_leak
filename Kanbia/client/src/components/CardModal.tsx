import { useEffect } from 'react';
import { IconClose } from './icons';

const LABELS: Record<string, { c: string; name: string }> = {
  ux: { c: '#61bd4f', name: 'UX' },
  frontend: { c: '#0079bf', name: 'Frontend' },
  backend: { c: '#eb5a46', name: 'Backend' },
  seguridad: { c: '#f2d600', name: 'Seguridad' },
  copy: { c: '#c377e0', name: 'Copy' },
};

const initials = (n: string) => n.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
const fmtDue = (d?: string | null) => {
  if (!d) return null;
  const dt = new Date(String(d).replace(' ', 'T'));
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export interface Card {
  id: number; title: string; description?: string; labels: string[];
  assignee?: { display_name: string; avatar_color: string } | null; due?: string | null;
}

export default function CardModal({ card, listName, onClose }: { card: Card; listName: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const labels = card.labels.filter((l) => LABELS[l]);
  const due = fmtDue(card.due);

  return (
    <div className="tc-back" onClick={onClose}>
      <div className="tc" onClick={(e) => e.stopPropagation()}>
        <button className="tc-x" onClick={onClose} aria-label="Cerrar"><IconClose size={20} /></button>

        <div className="tc-titlebar">
          <span className="tc-ico">☰</span>
          <div>
            <h2>{card.title}</h2>
            <div className="tc-sub">en la lista <b>{listName}</b></div>
          </div>
        </div>

        <div className="tc-grid">
          <div className="tc-main">
            {(labels.length > 0 || card.assignee || due) && (
              <div className="tc-meta">
                {card.assignee && (
                  <div className="tc-metablock">
                    <div className="tc-mlabel">Miembros</div>
                    <span className="avatar" style={{ width: 36, height: 36, background: card.assignee.avatar_color }} title={card.assignee.display_name}>{initials(card.assignee.display_name)}</span>
                  </div>
                )}
                {labels.length > 0 && (
                  <div className="tc-metablock">
                    <div className="tc-mlabel">Etiquetas</div>
                    <div className="tc-labs">{labels.map((l) => <span className="tc-lab" key={l} style={{ background: LABELS[l].c }}>{LABELS[l].name}</span>)}</div>
                  </div>
                )}
                {due && (
                  <div className="tc-metablock">
                    <div className="tc-mlabel">Vencimiento</div>
                    <span className="tc-due">📅 {due}</span>
                  </div>
                )}
              </div>
            )}

            <div className="tc-section">
              <div className="tc-shead">📝 Descripción</div>
              <div className="tc-desc">{card.description?.trim() ? card.description : <span className="muted">Añade una descripción más detallada…</span>}</div>
            </div>

            <div className="tc-section">
              <div className="tc-shead">💬 Actividad</div>
              <div className="tc-activity">
                <span className="avatar" style={{ width: 32, height: 32, background: card.assignee?.avatar_color || '#0079bf' }}>{initials(card.assignee?.display_name || 'Kanbia')}</span>
                <div className="tc-comment"><input className="input" placeholder="Escribe un comentario…" /></div>
              </div>
            </div>
          </div>

          <div className="tc-side">
            <div className="tc-mlabel">Añadir a la tarjeta</div>
            <button className="tc-sbtn">👤 Miembros</button>
            <button className="tc-sbtn">🏷️ Etiquetas</button>
            <button className="tc-sbtn">☑️ Checklist</button>
            <button className="tc-sbtn">🕓 Fechas</button>
            <button className="tc-sbtn">📎 Adjunto</button>
          </div>
        </div>
      </div>
    </div>
  );
}
