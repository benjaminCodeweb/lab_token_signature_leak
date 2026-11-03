import { useEffect, useState } from 'react';
import { api } from '../api';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';

type Tab = 'general' | 'members' | 'security';

export default function OrgSettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('general');
  const [members, setMembers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [locked, setLocked] = useState(false);
  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => { api.get('/api/config').then(setCfg).catch(() => {}); }, []);
  useEffect(() => { if (tab === 'members') api.get('/api/org/members').then((r) => setMembers(r.items)).catch(() => {}); }, [tab]);
  useEffect(() => {
    if (tab !== 'security') return;
    setLocked(false); setSettings(null);
    api.get('/api/org/settings').then(setSettings).catch((e) => { if (e?.status === 403) setLocked(true); });
  }, [tab]);

  const initials = (n: string) => n.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="app">
      <Topbar />
      <div className="kb-page">
        <div className="settings">
          <nav className="settings-nav">
            <div className="section-h">Organización</div>
            <button className={`sitem${tab === 'general' ? ' on' : ''}`} onClick={() => setTab('general')}>General</button>
            <button className={`sitem${tab === 'members' ? ' on' : ''}`} onClick={() => setTab('members')}>Miembros</button>
            <button className={`sitem${tab === 'security' ? ' on' : ''}`} onClick={() => setTab('security')}>Seguridad</button>
          </nav>

          <div className="settings-body">
            {tab === 'general' && (
              <>
                <h1>General</h1>
                <p className="muted" style={{ marginBottom: 16 }}>Ajustes básicos del espacio de trabajo.</p>
                <div className="kv-row"><span className="k">Aplicación</span><span>{cfg?.appName} · v{cfg?.version}</span></div>
                <div className="kv-row"><span className="k">Modo oscuro</span><span>{cfg?.features?.darkMode ? 'Disponible' : 'No'}</span></div>
                <div className="kv-row"><span className="k">Automatizaciones</span><span>{cfg?.features?.automations ? 'Activadas' : 'No'}</span></div>
                <div className="kv-row"><span className="k">Tu rol</span><span><span className={`rolechip${user?.role === 'admin' ? ' admin' : ''}`}>{user?.role === 'admin' ? 'Administrador' : 'Miembro'}</span></span></div>
              </>
            )}

            {tab === 'members' && (
              <>
                <h1>Miembros</h1>
                <p className="muted" style={{ marginBottom: 12 }}>Personas con acceso a la organización.</p>
                {members.map((m) => (
                  <div className="member" key={m.id}>
                    <span className="avatar" style={{ background: m.avatar_color }}>{initials(m.display_name)}</span>
                    <div className="pinfo"><b>{m.display_name}{m.id === user?.id ? ' (tú)' : ''}</b><span>{m.email}</span></div>
                    <span className={`rolechip${m.role === 'admin' ? ' admin' : ''}`}>{m.role === 'admin' ? 'Administrador' : 'Miembro'}</span>
                  </div>
                ))}
              </>
            )}

            {tab === 'security' && (
              <>
                <h1>Seguridad</h1>
                <p className="muted" style={{ marginBottom: 16 }}>Claves y ajustes sensibles de la organización.</p>
                {locked && (
                  <div className="locked">
                    <div className="lock">🔒</div>
                    <p><b>Solo administradores</b></p>
                    <p>Solo los administradores de la organización pueden ver esta sección.</p>
                  </div>
                )}
                {settings && (
                  <>
                    <div className="kv-row"><span className="k">Organización</span><span>{settings.orgName}</span></div>
                    <div className="kv-row"><span className="k">Plan</span><span>{settings.plan} · {settings.seats} asientos</span></div>
                    <div className="kv-row"><span className="k">Facturación</span><span>{settings.billingEmail}</span></div>
                    <div className="kv-row"><span className="k">Dominio SSO</span><span>{settings.ssoDomain}</span></div>
                    <div style={{ marginTop: 20 }}>
                      <div className="section-h">Clave maestra de la organización</div>
                      <p className="muted" style={{ fontSize: 13, margin: '4px 0 8px' }}>Rota las API keys, SCIM y exports. No la compartas.</p>
                      <div className="secret">{settings.masterKey}</div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
