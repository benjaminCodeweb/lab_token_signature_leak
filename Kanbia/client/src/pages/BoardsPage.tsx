import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Topbar from '../components/Topbar';
import { GridSkeleton } from '../components/ui';
import { IconApps } from '../components/icons';

interface Board { id: number; name: string; color: string; cards: number; }

export default function BoardsPage() {
  const nav = useNavigate();
  const [boards, setBoards] = useState<Board[] | null>(null);
  useEffect(() => { api.get('/api/boards').then((r) => setBoards(r.items)).catch(() => setBoards([])); }, []);
  return (
    <div className="app">
      <Topbar />
      <div className="kb-page">
        <div className="kb-home">
          <h2><IconApps size={20} /> Tus tableros</h2>
          {boards === null ? <GridSkeleton n={4} /> : (
            <div className="tiles">
              {boards.map((b) => (
                <div className="tile" key={b.id} style={{ background: b.color }} onClick={() => nav(`/b/${b.id}`)}>
                  {b.name}
                  <span className="cnt">{b.cards} tarjetas</span>
                </div>
              ))}
              <div className="tile newb" onClick={() => alert('Crear un tablero nuevo (demo).')}>Crear un tablero nuevo</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
