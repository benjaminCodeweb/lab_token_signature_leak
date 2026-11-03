import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { KanbiaLogo } from '../components/icons';

export default function RegisterPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [display_name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try { const r = await api.post('/api/auth/register', { display_name, email, password }); login(r.token, r.user); nav('/'); }
    catch (e: any) { setErr(e?.body?.error || 'No se pudo crear la cuenta'); }
  }
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="glogo" style={{ color: '#0079bf' }}><KanbiaLogo size={30} /> Kanbia</div>
        <h1>Crea tu cuenta</h1>
        <form onSubmit={submit}>
          <div className="field"><label>Nombre</label><input value={display_name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoFocus /></div>
          <div className="field"><label>Correo</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@kanbia.local" /></div>
          <div className="field"><label>Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 4 caracteres" /></div>
          <button className="btn block" type="submit">Registrarme</button>
          {err && <p className="err">{err}</p>}
        </form>
        <p className="hint">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>.</p>
      </div>
    </div>
  );
}
