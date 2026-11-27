// "Sugerir melhoria": qualquer usuário manda ideia/problema com foto ou arquivo; o admin lê e marca o andamento.
import { useEffect, useState } from 'react';
import { Lightbulb, Paperclip, X, Send, ImagePlus, FileText, Download } from 'lucide-react';
import { api } from '../lib/api';
import { Modal } from '../ui';

export const TIPOS = [
  ['ideia', '💡 Ideia nova'],
  ['problema', '🐞 Algo não funciona'],
  ['ajuste', '✏️ Ajuste ou melhoria'],
  ['visual', '🎨 Aparência / tela'],
];
export const STATUS = { nova: ['Recebida', '#2563eb'], analise: ['Em análise', '#d97706'], feita: ['Feita', '#16a34a'], descartada: ['Não será feita', '#64748b'] };
const MAX_MB = 8;
const TELAS = { hub: 'Visão geral', mapa: 'Mapa', cidadaos: 'Cidadãos', func: 'Funcionários', frotas: 'UNIfrotas', admin: 'Admin' };
const fdt = (d) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

// Botão do topo
export function SugestaoBotao({ session, tenant, view }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn sm sug-btn" data-tour="sugestao" title="Mande uma ideia, um problema ou um pedido de melhoria" onClick={() => setOpen(true)}>
        <Lightbulb size={16} /><span>Sugerir melhoria</span>
      </button>
      {open && <SugestaoModal session={session} tenant={tenant} view={view} onClose={() => setOpen(false)} />}
    </>
  );
}

function SugestaoModal({ session, tenant, view, onClose }) {
  const [f, setF] = useState({ tipo: 'ideia', texto: '' });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState(false);
  const [mine, setMine] = useState([]);
  useEffect(() => { api.mySuggestions().then(setMine).catch(() => {}); }, []);

  function addFiles(list) {
    const arr = [...list].filter((x) => x.size <= MAX_MB * 1048576);
    if (arr.length < list.length) setErr(`Cada arquivo pode ter até ${MAX_MB} MB.`);
    setFiles((cur) => [...cur, ...arr].slice(0, 5));
  }
  async function send(e) {
    e.preventDefault();
    if (f.texto.trim().length < 5) { setErr('Escreva sua sugestão (pelo menos algumas palavras).'); return; }
    setBusy(true); setErr('');
    try {
      await api.addSuggestion({ ...f, texto: f.texto.trim(), view, tenant_id: tenant?.id || null, user_name: session.user.name, user_email: session.user.email }, files);
      setOk(true);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }

  if (ok) return (
    <Modal title="Sugestão enviada" onClose={onClose}>
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center', textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 40 }}>🙌</div>
        <b>Obrigado! Sua sugestão chegou para a equipe do UNIcidade.</b>
        <span className="muted">Você acompanha o andamento aqui mesmo, em "Minhas sugestões".</span>
        <button className="btn primary" onClick={onClose}>Fechar</button>
      </div>
    </Modal>
  );

  return (
    <Modal title="Sugerir melhoria" onClose={onClose}>
      <form onSubmit={send} style={{ display: 'grid', gap: 12 }}>
        <span className="muted" style={{ fontSize: 13 }}>Conte o que pode ficar melhor no sistema. Pode mandar print da tela ou um arquivo para explicar.</span>
        <div className="sug-tipos">{TIPOS.map(([k, l]) => (
          <button type="button" key={k} className={`sug-tipo ${f.tipo === k ? 'on' : ''}`} onClick={() => setF({ ...f, tipo: k })}>{l}</button>))}</div>
        <label className="f">O que você sugere?
          <textarea className="input" rows={5} autoFocus value={f.texto} onChange={(e) => { setF({ ...f, texto: e.target.value }); setErr(''); }}
            placeholder="Ex.: Na aba de veículos, seria bom filtrar pela secretaria e ver quem está usando cada carro agora." />
        </label>
        <div className="sug-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
          <label className="btn sm"><ImagePlus size={14} />Foto ou print<input type="file" accept="image/*" capture="environment" hidden multiple onChange={(e) => addFiles(e.target.files)} /></label>
          <label className="btn sm"><Paperclip size={14} />Anexar arquivo<input type="file" hidden multiple onChange={(e) => addFiles(e.target.files)} /></label>
          <small className="muted">ou arraste aqui · até 5 arquivos de {MAX_MB} MB</small>
        </div>
        {files.length > 0 && <div className="sug-files">{files.map((x, i) => (
          <div key={i} className="sug-file">
            {x.type.startsWith('image/') ? <img src={URL.createObjectURL(x)} alt="" /> : <FileText size={20} />}
            <span>{x.name}<small>{kb(x.size)}</small></span>
            <button type="button" className="btn ghost sm" aria-label="Remover" onClick={() => setFiles(files.filter((_, j) => j !== i))}><X size={14} /></button>
          </div>))}</div>}
        {err && <small style={{ color: 'var(--bad)' }}>{err}</small>}
        <button className="btn primary" disabled={busy}><Send size={15} />{busy ? 'Enviando…' : 'Enviar sugestão'}</button>
        {mine.length > 0 && <div className="sug-mine">
          <b style={{ fontSize: 13 }}>Minhas sugestões</b>
          {mine.slice(0, 5).map((s) => (
            <div key={s.id}><span className="sug-st" style={{ '--c': STATUS[s.status]?.[1] }}>{STATUS[s.status]?.[0] || s.status}</span>
              <span className="grow">{s.texto.slice(0, 80)}{s.texto.length > 80 ? '…' : ''}</span><small className="muted">{fdt(s.created_at)}</small>
              {s.resposta && <em>Resposta: {s.resposta}</em>}</div>))}
        </div>}
      </form>
    </Modal>
  );
}

// Lista para o admin da plataforma (aba "Sugestões" no Admin)
export function SugestoesAdmin({ notify }) {
  const [list, setList] = useState([]); const [filtro, setFiltro] = useState('abertas');
  const load = () => api.suggestions().then(setList);
  useEffect(() => { load(); }, []);
  const shown = list.filter((s) => filtro === 'todas' || (filtro === 'abertas' ? ['nova', 'analise'].includes(s.status) : s.status === filtro));
  async function set(s, patch) { await api.updateSuggestion(s.id, patch); notify?.('Sugestão atualizada.'); load(); }
  async function openFile(a) { const url = await api.suggestionFileUrl(a); if (url) window.open(url, '_blank', 'noopener'); }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['abertas', 'Abertas'], ['nova', 'Recebidas'], ['analise', 'Em análise'], ['feita', 'Feitas'], ['descartada', 'Não serão feitas'], ['todas', 'Todas']].map(([k, l]) => (
          <button key={k} className={`btn sm ${filtro === k ? 'primary' : ''}`} onClick={() => setFiltro(k)}>{l} · {k === 'todas' ? list.length : list.filter((s) => (k === 'abertas' ? ['nova', 'analise'].includes(s.status) : s.status === k)).length}</button>))}
      </div>
      {shown.map((s) => (
        <div key={s.id} className="glass card sug-card">
          <div className="sug-head">
            <span className="sug-st" style={{ '--c': STATUS[s.status]?.[1] }}>{STATUS[s.status]?.[0]}</span>
            <b>{TIPOS.find((t) => t[0] === s.tipo)?.[1] || s.tipo}</b>
            <small className="muted">{s.user_name} · {s.tenant_name || 'sem cidade'} · tela: {TELAS[s.view] || s.view || '—'} · {fdt(s.created_at)}</small>
          </div>
          <p style={{ margin: '6px 0', whiteSpace: 'pre-wrap' }}>{s.texto}</p>
          {(s.anexos || []).length > 0 && <div className="sug-files">{s.anexos.map((a, i) => (
            <button key={i} className="sug-file" onClick={() => openFile(a)}>
              {a.preview ? <img src={a.preview} alt="" /> : <FileText size={20} />}<span>{a.name}<small>{kb(a.size)}</small></span><Download size={14} />
            </button>))}</div>}
          <div className="sug-actions">
            <select className="input sm" value={s.status} onChange={(e) => set(s, { status: e.target.value })}>{Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
            <input className="input sm" placeholder="Resposta para quem enviou (opcional)" defaultValue={s.resposta || ''} onBlur={(e) => e.target.value !== (s.resposta || '') && set(s, { resposta: e.target.value })} />
          </div>
        </div>))}
      {!shown.length && <div className="glass card muted">Nenhuma sugestão aqui.</div>}
    </div>
  );
}
