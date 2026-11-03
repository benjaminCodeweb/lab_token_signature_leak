import { useEffect, useRef } from 'react';

export interface MenuItem {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
}

export default function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', h);
    window.addEventListener('keydown', esc);
    window.addEventListener('scroll', onClose, true);
    return () => { window.removeEventListener('mousedown', h); window.removeEventListener('keydown', esc); window.removeEventListener('scroll', onClose, true); };
  }, [onClose]);
  // mantener dentro de viewport
  const left = Math.min(x, window.innerWidth - 240);
  const top = Math.min(y, window.innerHeight - items.length * 40 - 12);
  return (
    <div className="ctxmenu" style={{ left, top }} ref={ref} onClick={(e) => e.stopPropagation()}>
      {items.map((it, i) =>
        it.divider ? <div className="ctx-div" key={i} /> : (
          <button key={i} className={`ctx-item${it.danger ? ' danger' : ''}`} onClick={() => { it.onClick?.(); onClose(); }}>
            <span className="ci-ico">{it.icon}</span>{it.label}
          </button>
        )
      )}
    </div>
  );
}
