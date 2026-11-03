import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KanbiaLogo, IconSearch, IconApps, IconBell, IconSettings } from './icons';

export default function Topbar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const initials = (user?.display_name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  function toggleTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    if (dark) { document.documentElement.removeAttribute('data-theme'); localStorage.removeItem('kb_theme'); }
    else { document.documentElement.dataset.theme = 'dark'; localStorage.setItem('kb_theme', 'dark'); }
    setMenu(false);
  }
  return (
    <header className="kb-top">
      <button className="iconbtn" title="Menú"><IconApps size={20} /></button>
      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => nav('/')}><KanbiaLogo size={24} /> Kanbia</div>
      <div className="search" style={{ marginLeft: 12 }}>
        <input placeholder="Buscar" aria-label="Buscar" />
      </div>
      <span className="spacer" />
      <button className="iconbtn" title="Novedades"><IconBell size={20} /></button>
      <button className="iconbtn" title="Ajustes de la organización" onClick={() => nav('/org')}><IconSettings size={20} /></button>
      <div style={{ position: 'relative' }}>
        <div className="avatar" title={user?.display_name} onClick={() => setMenu((v) => !v)} style={{ background: (user as any)?.avatar_color || '#0079bf' }}>{initials}</div>
        {menu && (
          <div className="ctxmenu" style={{ right: 8, top: 44, left: 'auto', position: 'fixed' }} onMouseLeave={() => setMenu(false)}>
            <div style={{ padding: '8px 20px', fontSize: 13 }}><b>{user?.display_name}</b><div className="muted" style={{ fontSize: 12 }}>{user?.email}</div></div>
            <div className="ctx-div" />
            <button className="ctx-item" onClick={toggleTheme}>Cambiar tema</button>
            <button className="ctx-item" onClick={() => { nav('/org'); setMenu(false); }}>Ajustes de la organización</button>
            <div className="ctx-div" />
            <button className="ctx-item" onClick={logout}>Cerrar sesión</button>
          </div>
        )}
      </div>
    </header>
  );
}
