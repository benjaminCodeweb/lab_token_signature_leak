import { useEffect, useState } from 'react';

// ── Snackbar estilo Google (abajo-izquierda, con acción opcional) ──────────────
type Snack = { msg: string; actionLabel?: string; onAction?: () => void };
let show: ((s: Snack) => void) | null = null;
export function snackbar(msg: string, actionLabel?: string, onAction?: () => void) {
  show?.({ msg, actionLabel, onAction });
}
export function SnackbarHost() {
  const [s, setS] = useState<Snack | null>(null);
  useEffect(() => {
    show = (x) => { setS(x); window.clearTimeout((SnackbarHost as any)._t); (SnackbarHost as any)._t = window.setTimeout(() => setS(null), 5000); };
    return () => { show = null; };
  }, []);
  if (!s) return null;
  return (
    <div className="snackbar">
      <span>{s.msg}</span>
      {s.actionLabel && (
        <button onClick={() => { s.onAction?.(); setS(null); }}>{s.actionLabel}</button>
      )}
    </div>
  );
}

export function GridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: n }).map((_, i) => (
        <div className="card skel" key={i}>
          <div className="head"><span className="sk sk-ico" /><span className="sk sk-line" /></div>
          <div className="thumb"><span className="sk sk-thumb" /></div>
        </div>
      ))}
    </div>
  );
}

export function fmtSize(n: number): string {
  if (n <= 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
export function fmtDate(s?: string | null): string {
  if (!s) return '—';
  const d = new Date(s.replace(' ', 'T'));
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
