// Cidadão 360º: cadastro único do munícipe + linha do tempo de atendimentos de todas as secretarias.
// Dados pessoais (LGPD): acesso só para o perfil "geral", CPF mascarado e registro de quem abriu cada ficha.
import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, ShieldCheck, Phone, Mail, MapPin, Eye, UserRound } from 'lucide-react';
import { api } from '../lib/api';
import { Modal, initials } from '../ui';
// datas AAAA-MM-DD exibidas no fuso local (evita voltar um dia)
const fmtDate = (d) => (d ? new Date(String(d).slice(0, 10) + 'T12:00').toLocaleDateString('pt-BR') : '');

export const AREAS = {
  saude: ['Saúde', '🏥', '#e11d48'],
  educacao: ['Educação', '🏫', '#d97706'],
  social: ['Assistência social', '🤝', '#7c3aed'],
  tributos: ['Tributos e taxas', '🧾', '#0891b2'],
  transporte: ['Transporte (frota)', '🚐', '#2563eb'],
  ouvidoria: ['Ouvidoria e pedidos', '📣', '#16a34a'],
};
export const TAGS = ['Idoso', 'Gestante', 'Criança', 'Estudante', 'Pessoa com deficiência', 'Programa social', 'Zona rural', 'Acamado'];

const maskCpf = (c) => { const d = (c || '').replace(/\D/g, ''); return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : '—'; };
const idade = (n) => { if (!n) return null; const b = new Date(n + 'T12:00'); const t = new Date(); let a = t.getFullYear() - b.getFullYear(); if (t < new Date(t.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Cidadaos({ tenant, user, notify }) {
  const [list, setList] = useState([]);
  const [sel, setSel] = useState(null);
  const [events, setEvents] = useState([]);
  const [access, setAccess] = useState([]);
  const [q, setQ] = useState(''); const [tag, setTag] = useState(''); const [bairro, setBairro] = useState('');
  const [newC, setNewC] = useState(false); const [newE, setNewE] = useState(false);

  const load = () => api.citizens(tenant.id).then(setList);
  useEffect(() => { load(); }, [tenant.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function open(c) {
    setSel(c);
    await api.logCitizenAccess({ tenant_id: tenant.id, citizen_id: c.id, user_id: user.id, user_name: user.name });
    const [e, a] = await Promise.all([api.citizenEvents(c.id), api.citizenAccess(c.id)]);
    setEvents(e); setAccess(a);
  }

  const bairros = useMemo(() => [...new Set(list.map((c) => c.bairro).filter(Boolean))].sort(), [list]);
  const shown = list.filter((c) => (!q || norm(`${c.nome} ${c.cpf} ${c.telefone} ${c.bairro}`).includes(norm(q)))
    && (!tag || (c.tags || []).includes(tag)) && (!bairro || c.bairro === bairro));
  const byArea = Object.keys(AREAS).map((k) => [k, events.filter((e) => e.area === k)]);

  return (
    <>
      <div className="section-title" style={{ marginTop: 0 }}>
        <h2>Cidadão 360º <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>· {list.length} cadastrados</span></h2>
        <button className="btn primary sm" onClick={() => setNewC(true)}><Plus size={14} />Novo cidadão</button>
      </div>
      <div className="glass lgpd"><ShieldCheck size={16} />Dados pessoais protegidos pela LGPD: uso restrito ao atendimento público. O CPF aparece mascarado e cada ficha aberta fica registrada com nome e horário de quem acessou.</div>

      <div className="cid-grid">
        <div className="glass card cid-list">
          <div className="cid-search"><Search size={14} /><input placeholder="Buscar por nome, CPF, telefone ou bairro" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <select className="input sm" value={tag} onChange={(e) => setTag(e.target.value)}><option value="">Todos os perfis</option>{TAGS.map((t) => <option key={t}>{t}</option>)}</select>
            <select className="input sm" value={bairro} onChange={(e) => setBairro(e.target.value)}><option value="">Todos os bairros</option>{bairros.map((b) => <option key={b}>{b}</option>)}</select>
          </div>
          <div className="cid-items">
            {shown.map((c) => (
              <button key={c.id} className={`cid-item ${sel?.id === c.id ? 'on' : ''}`} onClick={() => open(c)}>
                <div className="avatar">{initials(c.nome)}</div>
                <div className="grow"><b>{c.nome}</b><small>{[idade(c.nascimento) != null && `${idade(c.nascimento)} anos`, c.bairro].filter(Boolean).join(' · ')}</small></div>
                {(c.tags || []).slice(0, 1).map((t) => <span key={t} className="badge">{t}</span>)}
              </button>))}
            {!shown.length && <span className="muted" style={{ padding: 8 }}>Nenhum cidadão encontrado.</span>}
          </div>
        </div>

        <div className="cid-main">
          {!sel && <div className="glass card cid-empty"><UserRound size={34} /><b>Selecione um cidadão</b><span className="muted">A ficha reúne em um só lugar o que cada secretaria fez por ele: saúde, educação, assistência, tributos, transporte e pedidos.</span></div>}
          {sel && <>
            <div className="glass card cid-head">
              <div className="avatar big">{initials(sel.nome)}</div>
              <div className="grow">
                <h2>{sel.nome}</h2>
                <div className="cid-meta">
                  <span>CPF {maskCpf(sel.cpf)}</span>
                  {sel.nascimento && <span>{idade(sel.nascimento)} anos · nasc. {fmtDate(sel.nascimento)}</span>}
                  {sel.telefone && <span><Phone size={12} />{sel.telefone}</span>}
                  {sel.email && <span><Mail size={12} />{sel.email}</span>}
                  {(sel.endereco || sel.bairro) && <span><MapPin size={12} />{[sel.endereco, sel.bairro].filter(Boolean).join(' · ')}</span>}
                </div>
                <div className="cid-tags">{(sel.tags || []).map((t) => <span key={t} className="badge">{t}</span>)}</div>
              </div>
              <button className="btn sm primary" onClick={() => setNewE(true)}><Plus size={14} />Registrar atendimento</button>
            </div>

            <div className="cid-areas">
              {byArea.map(([k, es]) => { const [l, ic, c] = AREAS[k]; return (
                <div key={k} className={`glass cid-area ${es.length ? '' : 'off'}`} style={{ '--c': c }}>
                  <span className="ic">{ic}</span><small>{l}</small><b>{es.length}</b>
                  <span className="last">{es[0] ? `Último: ${fmtDate(es[0].data)}` : 'Sem registros'}</span>
                </div>); })}
            </div>

            <div className="two" style={{ gridTemplateColumns: 'minmax(0,1fr) 260px' }}>
              <div className="glass card">
                <h3>Linha do tempo</h3>
                <div className="timeline">
                  {events.map((e) => { const [l, ic, c] = AREAS[e.area] || ['Outro', '•', '#64748b']; return (
                    <div key={e.id} className="tl" style={{ '--c': c }}>
                      <i>{ic}</i>
                      <div><b>{e.titulo}</b><small>{l} · {fmtDate(e.data)}{e.por ? ` · por ${e.por}` : ''}</small>{e.detalhe && <p>{e.detalhe}</p>}</div>
                    </div>); })}
                  {!events.length && <span className="muted">Nenhum atendimento registrado ainda.</span>}
                </div>
              </div>
              <div className="glass card">
                <h3 style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Eye size={15} />Quem acessou</h3>
                <div className="acc">{access.slice(0, 8).map((a) => <div key={a.id}><b>{a.user_name}</b><small>{new Date(a.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</small></div>)}</div>
                {sel.notas && <><h3 style={{ marginTop: 12 }}>Observações</h3><p className="muted" style={{ fontSize: 13, margin: 0 }}>{sel.notas}</p></>}
              </div>
            </div>
          </>}
        </div>
      </div>

      {newC && <NewCitizen tenant={tenant} onClose={() => setNewC(false)} onSaved={(c) => { setNewC(false); notify?.('Cidadão cadastrado.'); load().then(() => open(c)); }} />}
      {newE && sel && <NewEvent tenant={tenant} user={user} citizen={sel} onClose={() => setNewE(false)} onSaved={() => { setNewE(false); api.citizenEvents(sel.id).then(setEvents); }} />}
    </>
  );
}

function NewCitizen({ tenant, onClose, onSaved }) {
  const [f, setF] = useState({ nome: '', cpf: '', nascimento: '', telefone: '', email: '', endereco: '', bairro: '', tags: [], notas: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const [err, setErr] = useState('');
  async function save(e) {
    e.preventDefault();
    try { onSaved(await api.addCitizen({ ...f, nascimento: f.nascimento || null, tenant_id: tenant.id })); } catch (x) { setErr(x.message); }
  }
  return (
    <Modal title="Novo cidadão" onClose={onClose}>
      <form onSubmit={save} style={{ display: 'grid', gap: 10 }}>
        <label className="f">Nome completo<input className="input" required autoFocus value={f.nome} onChange={set('nome')} /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <label className="f">CPF<input className="input" value={f.cpf} onChange={set('cpf')} placeholder="000.000.000-00" /></label>
          <label className="f">Nascimento<input className="input" type="date" value={f.nascimento} onChange={set('nascimento')} /></label>
          <label className="f">Telefone<input className="input" value={f.telefone} onChange={set('telefone')} /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <label className="f">Endereço<input className="input" value={f.endereco} onChange={set('endereco')} /></label>
          <label className="f">Bairro / localidade<input className="input" value={f.bairro} onChange={set('bairro')} /></label>
        </div>
        <label className="f">E-mail<input className="input" type="email" value={f.email} onChange={set('email')} /></label>
        <div className="f">Perfil (ajuda a priorizar atendimentos)
          <div className="cid-tags">{TAGS.map((t) => (
            <label key={t} className={`tagchk ${f.tags.includes(t) ? 'on' : ''}`}><input type="checkbox" checked={f.tags.includes(t)} onChange={() => setF({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] })} />{t}</label>))}</div></div>
        <label className="f">Observações<textarea className="input" rows={2} value={f.notas} onChange={set('notas')} /></label>
        <small className="muted"><ShieldCheck size={12} /> Cadastre só o necessário para o atendimento (princípio da necessidade da LGPD).</small>
        {err && <small style={{ color: 'var(--bad)' }}>{err}</small>}
        <button className="btn primary">Salvar cidadão</button>
      </form>
    </Modal>
  );
}

function NewEvent({ tenant, user, citizen, onClose, onSaved }) {
  const [f, setF] = useState({ area: 'saude', titulo: '', data: new Date().toLocaleDateString('sv-SE'), detalhe: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) { e.preventDefault(); await api.addCitizenEvent({ ...f, tenant_id: tenant.id, citizen_id: citizen.id, por: user.name }); onSaved(); }
  return (
    <Modal title={`Registrar atendimento · ${citizen.nome}`} onClose={onClose}>
      <form onSubmit={save} style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label className="f">Secretaria / área<select className="input" value={f.area} onChange={set('area')}>{Object.entries(AREAS).map(([k, [l, ic]]) => <option key={k} value={k}>{ic} {l}</option>)}</select></label>
          <label className="f">Data<input className="input" type="date" value={f.data} onChange={set('data')} /></label>
        </div>
        <label className="f">O que foi feito<input className="input" required autoFocus placeholder="Consulta na UBS, matrícula, transporte para Juiz de Fora…" value={f.titulo} onChange={set('titulo')} /></label>
        <label className="f">Detalhes (opcional)<textarea className="input" rows={3} value={f.detalhe} onChange={set('detalhe')} /></label>
        <button className="btn primary">Salvar na linha do tempo</button>
      </form>
    </Modal>
  );
}
