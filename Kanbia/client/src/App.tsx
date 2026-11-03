import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardsPage from './pages/BoardsPage';
import BoardPage from './pages/BoardPage';
import OrgSettingsPage from './pages/OrgSettingsPage';
import { SnackbarHost } from './components/ui';

const WriteupPage = lazy(() => import('./pages/WriteupPage'));

export default function App() {
  useEffect(() => {
    if (localStorage.getItem('kb_theme') === 'dark') document.documentElement.dataset.theme = 'dark';
    // El cliente lee la config de runtime al arrancar (nombre app, features…).
    fetch('/api/config').then((r) => r.json()).then((c) => { (window as any).__KB_CONFIG__ = c; }).catch(() => {});
  }, []);
  const P = (el: JSX.Element) => <ProtectedRoute>{el}</ProtectedRoute>;
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={P(<BoardsPage />)} />
        <Route path="/b/:id" element={P(<BoardPage />)} />
        <Route path="/org" element={P(<OrgSettingsPage />)} />
        <Route path="/writeup" element={P(<Suspense fallback={<div className="center-screen">Cargando…</div>}><WriteupPage /></Suspense>)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SnackbarHost />
    </>
  );
}
