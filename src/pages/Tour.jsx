// Mini tutorial: passeio rápido que destaca na tela as principais funções. Abre sozinho na 1ª vez de cada usuário.
import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GraduationCap, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { api } from '../lib/api';

const STEPS = [
  { sel: '[data-tour="city"]', t: 'Sua prefeitura', d: 'Aqui aparece a cidade em que você está trabalhando, com o brasão.' },
  { sel: '[data-tour="hub"]', t: 'Visão geral', d: 'O resumo da cidade: clima, população e os módulos de cada secretaria.' },
  { sel: '[data-tour="mapa"]', t: 'Mapa da cidade', d: 'Prédios públicos, frota por secretaria e alertas piscando onde há ocorrência.' },
  { sel: '[data-tour="cidadaos"]', t: 'Cidadãos', d: 'A ficha de cada morador, com tudo o que a prefeitura fez por ele. Protegido pela LGPD.' },
  { sel: '[data-tour="func"]', t: 'Funcionários', d: 'Quadro de pessoal: cargo, secretaria, CNH e uso da frota.' },
  { sel: '[data-tour="frotas"]', t: 'UNIfrotas', d: 'Veículos, saídas, abastecimento e as ordens de serviço de manutenção.' },
  { sel: '[data-tour="sugestao"]', t: 'Sugerir melhoria', d: 'Viu algo para melhorar? Mande sua ideia aqui, com foto ou arquivo.' },
  { sel: '[data-tour="tema"]', t: 'Tema claro ou cinza', d: 'Troque a aparência do sistema quando quiser.' },
  { sel: '[data-tour="tour"]', t: 'Rever este tutorial', d: 'Clique em "Como usar" sempre que quiser ver este passeio de novo.' },
];

// Abre sozinho no 1º e no 2º acesso de cada usuário (contado no banco, vale em qualquer aparelho).
export function TourBotao({ userId }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const flag = `uc-tour-sess-${userId}`;
    try { if (sessionStorage.getItem(flag)) return; sessionStorage.setItem(flag, '1'); } catch { /* ignore */ }
    let t;
    api.tourShouldShow().then((show) => { if (show) t = setTimeout(() => setOn(true), 2800); }).catch(() => {});
    return () => clearTimeout(t);
  }, [userId]);
  const close = () => setOn(false);
  return (
    <>
      <button className="btn sm" data-tour="tour" title="Veja um passeio rápido pelas funções do sistema" onClick={() => setOn(true)}><GraduationCap size={16} /><span className="hide-sm">Como usar</span></button>
      {on && <Tour onClose={close} />}
    </>
  );
}

function Tour({ onClose }) {
  const steps = STEPS.filter((s) => document.querySelector(s.sel));
  const [i, setI] = useState(0);
  const [r, setR] = useState(null);
  const step = steps[i];
  useLayoutEffect(() => {
    const upd = () => { const el = step && document.querySelector(step.sel); setR(el ? el.getBoundingClientRect() : null); };
    upd(); window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd);
  }, [step]);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') setI((x) => Math.min(x + 1, steps.length - 1)); if (e.key === 'ArrowLeft') setI((x) => Math.max(x - 1, 0)); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose, steps.length]);
  if (!step || !r) return null;
  const pad = 6, W = 300;
  const left = Math.min(Math.max(12, r.left + r.width / 2 - W / 2), window.innerWidth - W - 12);
  const last = i === steps.length - 1;
  return createPortal(
    <div className="tour" onClick={onClose}>
      <div className="tour-ring" style={{ left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }} />
      <div className="tour-tip glass" style={{ left, top: r.bottom + 14, width: W }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={step.t}>
        <div className="tour-arrow" style={{ left: Math.min(Math.max(16, r.left + r.width / 2 - left), W - 16) }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <small className="muted">{i + 1} de {steps.length}</small>
          <button className="btn ghost sm" aria-label="Fechar tutorial" onClick={onClose}><X size={14} /></button>
        </div>
        <b>{step.t}</b>
        <p>{step.d}</p>
        <div className="tour-dots">{steps.map((_, j) => <i key={j} className={j === i ? 'on' : ''} />)}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {i > 0 && <button className="btn sm" onClick={() => setI(i - 1)}><ArrowLeft size={14} />Voltar</button>}
          {last ? <button className="btn sm primary" onClick={onClose}>Entendi</button>
            : <button className="btn sm primary" onClick={() => setI(i + 1)}>Próximo<ArrowRight size={14} /></button>}
        </div>
      </div>
    </div>, document.body);
}
