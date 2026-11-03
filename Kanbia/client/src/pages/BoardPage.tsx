import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Topbar from '../components/Topbar';
import { snackbar } from '../components/ui';
import { IconBack, IconPlus } from '../components/icons';
import CardModal, { Card } from '../components/CardModal';

const LABEL_COLORS: Record<string, string> = {
  ux: '#61bd4f', frontend: '#0079bf', backend: '#eb5a46', seguridad: '#f2d600', copy: '#c377e0',
};

export default function BoardPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [board, setBoard] = useState<any>(null);
  const [adding, setAdding] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [open, setOpen] = useState<{ card: Card; listName: string } | null>(null);

  const load = () => api.get(`/api/boards/${id}`).then(setBoard).catch(() => nav('/'));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function addCard(listId: number) {
    if (!title.trim()) { setAdding(null); return; }
    try { await api.post(`/api/boards/${id}/cards`, { list_id: listId, title }); setTitle(''); setAdding(null); load(); snackbar('Tarjeta añadida'); }
    catch { snackbar('No se pudo añadir'); }
  }

  if (!board) return <div className="app"><Topbar /><div className="center-screen">Cargando…</div></div>;
  return (
    <div className="app">
      <Topbar />
      <div className="kb-board" style={{ background: board.color }}>
        <div className="kb-bhead"><button className="iconbtn" style={{ color: '#fff' }} onClick={() => nav('/')}><IconBack size={20} /></button>{board.name}</div>
        <div className="kb-lists">
          {board.lists.map((l: any) => (
            <div className="kb-list" key={l.id}>
              <h3>{l.name}</h3>
              <div className="kb-cards">
                {l.cards.map((c: any) => (
                  <div className="kb-card" key={c.id} onClick={() => setOpen({ card: c, listName: l.name })}>
                    {c.labels.length > 0 && <div className="labels">{c.labels.map((lb: string) => <span className="lab" key={lb} style={{ background: LABEL_COLORS[lb] || '#b3bac5' }} title={lb} />)}</div>}
                    <div className="t">{c.title}</div>
                    {c.assignee && <div className="foot"><span className="avatar" style={{ width: 24, height: 24, fontSize: 11, background: c.assignee.avatar_color }} title={c.assignee.display_name}>{c.assignee.display_name.split(' ').map((s: string) => s[0]).slice(0, 2).join('')}</span></div>}
                  </div>
                ))}
              </div>
              {adding === l.id ? (
                <input className="input" autoFocus value={title} placeholder="Título de la tarjeta…"
                  onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCard(l.id)} onBlur={() => addCard(l.id)}
                  style={{ marginTop: 6, background: '#fff' }} />
              ) : (
                <button className="kb-addcard" onClick={() => { setAdding(l.id); setTitle(''); }}><IconPlus size={16} /> Añadir una tarjeta</button>
              )}
            </div>
          ))}
        </div>
      </div>
      {open && <CardModal card={open.card} listName={open.listName} onClose={() => setOpen(null)} />}
    </div>
  );
}
