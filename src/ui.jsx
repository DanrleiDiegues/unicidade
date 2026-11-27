import {
  Truck, HeartPulse, GraduationCap, Construction, Landmark, HandHeart, Map, Sparkles, X,
} from 'lucide-react';

const ICONS = { Truck, HeartPulse, GraduationCap, Construction, Landmark, HandHeart, Map, Sparkles };
export const ModIcon = ({ name, size = 22 }) => { const I = ICONS[name] || Sparkles; return <I size={size} strokeWidth={1.7} />; };

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="b b1" /><div className="b b2" /><div className="b b3" />
      <svg viewBox="0 0 1200 300" preserveAspectRatio="none" fill="currentColor">
        <path d="M0 300V210h60v-40h40v40h30V150h50v60h40v-90h30v-30h20v30h30v90h50V180h60v-60h40v60h30v30h70V140h20V90h40v50h20v70h50v-50h60v50h40V110h70v100h30v-40h50v40h60V160h40v-50h30v50h30v50h60v-30h40v30h70v90z" />
      </svg>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal glass" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{title}</h3>
          <button className="btn ghost sm" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Kpi = ({ icon, label, value, sub }) => (
  <div className="glass kpi">
    <div className="k-label">{icon}{label}</div>
    <div className="k-val">{value}</div>
    {sub && <div className="k-sub">{sub}</div>}
  </div>
);

export const fmtDate = (iso) => new Date(iso).toLocaleDateString('pt-BR');
export const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
