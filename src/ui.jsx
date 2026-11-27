import { createPortal } from 'react-dom';
import {
  Truck, HeartPulse, GraduationCap, Construction, Landmark, HandHeart, Map, Sparkles, X,
} from 'lucide-react';

const ICONS = { Truck, HeartPulse, GraduationCap, Construction, Landmark, HandHeart, Map, Sparkles };
export const ModIcon = ({ name, size = 22 }) => { const I = ICONS[name] || Sparkles; return <I size={size} strokeWidth={1.7} />; };

// Logo UNIcidade: a cidade como uma rede conectada.
export const UniLogo = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden>
    <rect width="34" height="34" rx="9" fill="#0e7490" />
    <g stroke="#fff" strokeWidth="1.6" fill="none"><path d="M9 11 17 8l8 3M9 11v12l8 3 8-3V11M17 8v18" /></g>
    <g fill="#fff"><circle cx="9" cy="11" r="2" /><circle cx="25" cy="11" r="2" /><circle cx="17" cy="26" r="2" /><circle cx="17" cy="8" r="2" /></g>
  </svg>
);
export const Brand = () => (
  <div className="brand"><UniLogo /><span><b>UNI</b>cidade</span></div>
);

// Fundo: mapa viário em traço fino, desenhado uma vez (leve e nítido em qualquer tela).
const streets = (() => {
  const d = [];
  for (let i = -2; i < 26; i++) d.push(`M${i * 70} -50 l${120} 1300`);
  for (let j = -2; j < 18; j++) d.push(`M-100 ${j * 76} l2200 ${-160}`);
  return d.join(' ');
})();
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="b b1" /><div className="b b2" /><div className="b b3" />
      <svg className="map" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <path d={streets} className="st" />
        <path d="M-50 860 C 300 700, 520 760, 760 560 S 1200 300, 1700 260" className="av" />
        <path d="M120 -40 C 260 220, 300 420, 520 620 S 760 980, 820 1100" className="av" />
        <path d="M-40 420 C 260 380, 560 470, 900 430 S 1400 330, 1700 360" className="rv" />
        <circle cx="760" cy="560" r="5" className="pt" />
      </svg>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  // Portal: abre sempre por cima da página, mesmo quando um modal abre outro.
  return createPortal(
    <div className="modal-bg" onClick={onClose}>
      <div className="modal glass" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{title}</h3>
          <button className="btn ghost sm" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
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
