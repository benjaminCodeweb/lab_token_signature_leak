import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { KanbiaLogo } from '../components/icons';

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try { const r = await api.post('/api/auth/login', { email, password }); login(r.token, r.user); nav('/'); }
    catch (e: any) { setErr(e?.body?.error || 'No se pudo iniciar sesión'); }
  }
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="glogo" style={{ color: '#0079bf' }}><KanbiaLogo size={30} /> Kanbia</div>
        <h1>Inicia sesión para continuar</h1>
        <form onSubmit={submit}>
          <div className="field"><label>Correo</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@kanbia.local" autoFocus /></div>
          <div className="field"><label>Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
          <button className="btn block" type="submit">Iniciar sesión</button>
          {err && <p className="err">{err}</p>}
        </form>
        <p className="hint">¿No tienes cuenta? <Link to="/register">Regístrate</Link>.<br />Cuenta de demo: <b>attacker@kanbia.local</b> / <b>password123</b></p>
      </div>
    </div>
  );
}
