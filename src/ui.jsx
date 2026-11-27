import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Truck, HeartPulse, GraduationCap, Construction, Landmark, HandHeart, Map, Sparkles, X,
} from 'lucide-react';

const ICONS = { Truck, HeartPulse, GraduationCap, Construction, Landmark, HandHeart, Map, Sparkles };
export const ModIcon = ({ name, size = 22 }) => { const I = ICONS[name] || Sparkles; return <I size={size} strokeWidth={1.7} />; };

// Logo UNIcidade (D1): pórtico com cúpula, o paço municipal. Cores seguem o tema (White/Grey).
export const UniLogo = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 46 46" aria-hidden className="uni-logo">
    <path d="M13 15a10 10 0 0 1 20 0z" fill="var(--logo-soft)" />
    <rect x="22" y="2" width="2" height="4" fill="var(--logo-main)" />
    <rect x="6" y="15" width="34" height="4" rx="1.5" fill="var(--logo-main)" />
    <rect x="9" y="21" width="4.5" height="15" rx="1.5" fill="var(--logo-main)" />
    <rect x="17" y="21" width="4.5" height="15" rx="1.5" fill="var(--logo-main)" />
    <rect x="24.5" y="21" width="4.5" height="15" rx="1.5" fill="var(--logo-main)" />
    <rect x="32.5" y="21" width="4.5" height="15" rx="1.5" fill="var(--logo-main)" />
    <rect x="4" y="38" width="38" height="4" rx="2" fill="var(--logo-accent)" />
  </svg>
);
export const Brand = () => (
  <div className="brand"><UniLogo size={36} /><span className="brand-word">UNIcidade</span></div>
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

// Abertura após o login: monta o pórtico, mostra o nome e depois o brasão da cidade.
export function Splash({ tenant, onDone }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const fast = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t1 = setTimeout(() => setOut(true), fast ? 500 : (tenant ? 2100 : 1500));
    const t2 = setTimeout(onDone, fast ? 800 : (tenant ? 2500 : 1900));
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`splash ${out ? 'out' : ''}`} onClick={onDone} role="status" aria-label="Carregando UNIcidade">
      <div className="splash-in">
        <svg width="92" height="92" viewBox="0 0 46 46" aria-hidden className="sp-logo">
          <path className="sp-dome" d="M13 15a10 10 0 0 1 20 0z" fill="var(--logo-soft)" />
          <rect className="sp-mast" x="22" y="2" width="2" height="4" fill="var(--logo-main)" />
          <rect className="sp-beam" x="6" y="15" width="34" height="4" rx="1.5" fill="var(--logo-main)" />
          {[9, 17, 24.5, 32.5].map((x, i) => <rect key={x} className="sp-col" style={{ animationDelay: `${0.12 + i * 0.07}s` }} x={x} y="21" width="4.5" height="15" rx="1.5" fill="var(--logo-main)" />)}
          <rect className="sp-base" x="4" y="38" width="38" height="4" rx="2" fill="var(--logo-accent)" />
        </svg>
        <div className="sp-word">UNIcidade</div>
        {tenant && (
          <div className="sp-city">
            {tenant.logo_url && <img src={tenant.logo_url} alt={`Brasão de ${tenant.name}`} />}
            <div><small>Prefeitura de</small><b>{tenant.name}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}
