// Funcionários 360º: quadro de pessoal da prefeitura, com cargo, lotação, CNH e uso da frota.
// Só o perfil geral (gabinete) acessa. Sem CPF/salário: apenas o necessário para a gestão.
import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Pencil, Phone, Mail, BadgeCheck, Car, CalendarClock, IdCard, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { Modal, initials } from '../ui';

export const CARGOS = ['Prefeito Municipal', 'Vice-prefeito', 'Chefe de Gabinete', 'Assessor(a)', 'Secretário(a) Municipal', 'Diretor(a)', 'Motorista',
  'Chefe de Transporte', 'Monitor(a) de transporte escolar', 'Auxiliar Administrativo', 'Técnico(a) de Contabilidade', 'Contador(a)', 'Tesoureiro(a)',
  'Controle Interno', 'Fiscal de Tributos', 'Engenheiro(a)', 'Enfermeiro(a)', 'Assistente Social', 'Psicólogo(a)', 'Professor(a)', 'Serviços Gerais',
  'Operador(a) de máquinas', 'Advogado(a) / Procurador(a)', 'Agente de Contratação', 'Técnico(a) de Informática', 'Outro'];
export const SECRETARIAS = ['Gabinete', 'Administração e Finanças', 'Educação e Cultura', 'Saúde', 'Obras e Serviços Urbanos', 'Assistência Social', 'Agricultura e Meio Ambiente', 'Esporte e Lazer', 'Transportes'];
export const VINCULOS = ['Efetivo', 'Comissionado', 'Contratado', 'Agente político', 'Estagiário'];
const CNH_CATS = ['', 'A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE'];

const fd = (d) => (d ? new Date(String(d).slice(0, 10) + 'T12:00').toLocaleDateString('pt-BR') : '—');
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nice = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (m) => m.toUpperCase()).replace(/\s(De|Da|Do|Dos|Das|E)\s/g, (m) => m.toLowerCase()) : s);
const tempoCasa = (d) => { if (!d) return '—'; const m = Math.max(0, Math.round((Date.now() - new Date(d + 'T12:00')) / (30.44 * 864e5))); return m < 12 ? `${m} meses` : `${Math.floor(m / 12)} ano${m >= 24 ? 's' : ''}${m % 12 ? ` e ${m % 12} m` : ''}`; };
const cnhDias = (d) => (d ? Math.round((new Date(d + 'T12:00') - Date.now()) / 864e5) : null);

export default function Funcionarios({ tenant, notify }) {
  const [list, setList] = useState([]); const [moves, setMoves] = useState([]); const [vehicles, setVehicles] = useState([]);
  const [sel, setSel] = useState(null); const [edit, setEdit] = useState(null);
  const [q, setQ] = useState(''); const [sec, setSec] = useState(''); const [cargo, setCargo] = useState(''); const [ativos, setAtivos] = useState(true);

  const load = () => Promise.all([api.employees(tenant.id), api.moves(tenant.id).catch(() => []), api.vehicles(tenant.id)])
    .then(([e, m, v]) => { setList(e); setMoves(m); setVehicles(v); return e; });
  useEffect(() => { load(); }, [tenant.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargos = useMemo(() => [...new Set(list.map((e) => e.cargo).filter(Boolean))].sort(), [list]);
  const shown = list.filter((e) => (!ativos || e.ativo !== false) && (!sec || e.secretaria === sec) && (!cargo || e.cargo === cargo)
    && (!q || norm(`${e.nome} ${e.cargo} ${e.secretaria}`).includes(norm(q))));
  const vencendo = list.filter((e) => { const d = cnhDias(e.cnh_validade); return d != null && d <= 60; }).length;
  const semCargo = list.filter((e) => !e.cargo).length;

  const myMoves = sel ? moves.filter((m) => norm(m.driver) && (norm(m.driver).includes(norm(sel.nome).split(' ')[0]) && norm(sel.nome).includes(norm(m.driver).split(' ')[0]))) : [];
  const dias = sel ? cnhDias(sel.cnh_validade) : null;

  return (
    <>
      <div className="section-title" style={{ marginTop: 0 }}>
        <h2>Funcionários <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>· {list.filter((e) => e.ativo !== false).length} ativos</span></h2>
        <button className="btn primary sm" onClick={() => setEdit({})}><Plus size={14} />Novo funcionário</button>
      </div>

      <div className="emp-kpis">
        <div className="glass"><small>Ativos</small><b>{list.filter((e) => e.ativo !== false).length}</b></div>
        <div className="glass"><small>Secretarias com pessoal</small><b>{new Set(list.map((e) => e.secretaria).filter(Boolean)).size}</b></div>
        <div className={`glass ${vencendo ? 'warn' : ''}`}><small>CNH vencida ou a vencer (60 dias)</small><b>{vencendo}</b></div>
        <div className={`glass ${semCargo ? 'warn' : ''}`}><small>Sem cargo definido</small><b>{semCargo}</b></div>
      </div>

      <div className="cid-grid">
        <div className="glass card cid-list">
          <div className="cid-search"><Search size={14} /><input placeholder="Buscar por nome, cargo ou secretaria" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <select className="input sm" value={sec} onChange={(e) => setSec(e.target.value)}><option value="">Todas as secretarias</option>{SECRETARIAS.map((s) => <option key={s}>{s}</option>)}</select>
            <select className="input sm" value={cargo} onChange={(e) => setCargo(e.target.value)}><option value="">Todos os cargos</option>{cargos.map((s) => <option key={s}>{s}</option>)}</select>
          </div>
          <label className="chk" style={{ fontSize: 12 }}><input type="checkbox" checked={ativos} onChange={() => setAtivos(!ativos)} />Só ativos</label>
          <div className="cid-items">
            {shown.map((e) => (
              <button key={e.id} className={`cid-item ${sel?.id === e.id ? 'on' : ''}`} onClick={() => setSel(e)}>
                <div className="avatar">{initials(nice(e.nome))}</div>
                <div className="grow"><b>{nice(e.nome)}</b><small>{[e.cargo || 'Cargo a definir', e.secretaria].filter(Boolean).join(' · ')}</small></div>
                {e.ativo === false && <span className="badge">Inativo</span>}
              </button>))}
            {!shown.length && <span className="muted" style={{ padding: 8 }}>Nenhum funcionário encontrado.</span>}
          </div>
        </div>

        <div className="cid-main">
          {!sel && <div className="glass card cid-empty"><BadgeCheck size={34} /><b>Selecione um funcionário</b><span className="muted">A ficha mostra cargo, lotação, tempo de casa, CNH e o uso que ele faz da frota.</span></div>}
          {sel && <>
            <div className="glass card cid-head">
              <div className="avatar big">{initials(nice(sel.nome))}</div>
              <div className="grow">
                <h2>{nice(sel.nome)}</h2>
                <div className="cid-meta">
                  <span><b style={{ color: 'var(--text)' }}>{sel.cargo || 'Cargo a definir'}</b></span>
                  {sel.secretaria && <span>{sel.secretaria}</span>}
                  {sel.vinculo && <span>{sel.vinculo}</span>}
                  {sel.telefone && <span><Phone size={12} />{sel.telefone}</span>}
                  {sel.email && <span><Mail size={12} />{sel.email}</span>}
                </div>
                <div className="cid-tags">
                  <span className="badge">{sel.ativo === false ? 'Inativo' : 'Ativo'}</span>
                </div>
              </div>
              <button className="btn sm" onClick={() => setEdit(sel)}><Pencil size={14} />Editar</button>
            </div>

            <div className="cid-areas" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="glass cid-area" style={{ '--c': '#2563eb' }}><span className="ic"><CalendarClock size={18} /></span><small>Tempo de casa</small><b style={{ fontSize: 18 }}>{tempoCasa(sel.desde)}</b><span className="last">Desde {fd(sel.desde)}</span></div>
              <div className="glass cid-area" style={{ '--c': dias != null && dias <= 60 ? '#dc2626' : '#16a34a' }}><span className="ic"><IdCard size={18} /></span><small>CNH</small>
                <b style={{ fontSize: 18 }}>{sel.cnh_cat || '—'}</b><span className="last">{sel.cnh_validade ? (dias < 0 ? `Vencida há ${-dias} dias` : `Vence em ${fd(sel.cnh_validade)}`) : 'Não informada'}</span></div>
              <div className="glass cid-area" style={{ '--c': '#0891b2' }}><span className="ic"><Car size={18} /></span><small>Saídas com veículo</small><b>{myMoves.length}</b><span className="last">{myMoves[0] ? `Última: ${fd(myMoves[0].out_at)}` : 'Nenhuma registrada'}</span></div>
              <div className="glass cid-area" style={{ '--c': '#7c3aed' }}><span className="ic">🚗</span><small>Veículos usados</small><b>{new Set(myMoves.map((m) => m.vehicle_id)).size}</b><span className="last">no UNIfrotas</span></div>
            </div>
            {dias != null && dias <= 60 && <div className="alert" style={{ marginTop: 0 }}><AlertTriangle size={13} /> CNH {dias < 0 ? 'vencida' : 'perto de vencer'}: não escale este motorista sem regularizar.</div>}

            <div className="glass card">
              <h3>Uso da frota</h3>
              <div className="timeline">
                {myMoves.slice(0, 12).map((m) => { const v = vehicles.find((x) => x.id === m.vehicle_id); return (
                  <div key={m.id} className="tl" style={{ '--c': '#0891b2' }}><i>🚐</i>
                    <div><b>{v ? `${v.plate} · ${v.model}` : 'Veículo'}</b><small>{fd(m.out_at)}{m.in_at ? ` → devolvido ${fd(m.in_at)}` : ' · em uso'}{m.setor ? ` · ${m.setor}` : ''}</small>{m.finalidade && <p>{m.finalidade}</p>}</div>
                  </div>); })}
                {!myMoves.length && <span className="muted">Nenhuma saída de veículo registrada no nome dele no UNIfrotas.</span>}
              </div>
              {sel.notas && <><h3 style={{ marginTop: 12 }}>Observações</h3><p className="muted" style={{ fontSize: 13, margin: 0 }}>{sel.notas}</p></>}
            </div>
          </>}
        </div>
      </div>

      {edit && <EmpForm tenant={tenant} emp={edit} onClose={() => setEdit(null)} onSaved={async (id) => { setEdit(null); notify?.('Funcionário salvo.'); const l = await load(); setSel(l.find((x) => x.id === id) || null); }} />}
    </>
  );
}

function EmpForm({ tenant, emp, onClose, onSaved }) {
  const [f, setF] = useState({ nome: '', cargo: '', secretaria: '', vinculo: '', desde: '', ativo: true, telefone: '', email: '', cnh_cat: '', cnh_validade: '', notas: '', ...emp });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const [err, setErr] = useState('');
  async function save(e) {
    e.preventDefault();
    const { id, created_at, tenant_id, ...rest } = f; // eslint-disable-line no-unused-vars
    const data = { ...rest, desde: f.desde || null, cnh_validade: f.cnh_validade || null };
    try {
      if (id) { await api.updateEmployee(id, data); onSaved(id); }
      else { const n = await api.addEmployee({ ...data, tenant_id: tenant.id, origem: 'Cadastro manual' }); onSaved(n.id); }
    } catch (x) { setErr(x.message); }
  }
  return (
    <Modal title={emp.id ? `Editar · ${nice(emp.nome)}` : 'Novo funcionário'} onClose={onClose}>
      <form onSubmit={save} style={{ display: 'grid', gap: 10 }}>
        <label className="f">Nome completo<input className="input" required autoFocus value={f.nome} onChange={set('nome')} /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label className="f">Cargo<input className="input" list="uc-cargos" value={f.cargo} onChange={set('cargo')} placeholder="Escolha ou digite" /></label>
          <label className="f">Secretaria / lotação<select className="input" value={f.secretaria} onChange={set('secretaria')}><option value="">—</option>{SECRETARIAS.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="f">Vínculo<select className="input" value={f.vinculo} onChange={set('vinculo')}><option value="">—</option>{VINCULOS.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="f">Na prefeitura desde<input className="input" type="date" value={f.desde || ''} onChange={set('desde')} /></label>
          <label className="f">Telefone<input className="input" value={f.telefone || ''} onChange={set('telefone')} /></label>
          <label className="f">E-mail<input className="input" type="email" value={f.email || ''} onChange={set('email')} /></label>
          <label className="f">CNH · categoria<select className="input" value={f.cnh_cat || ''} onChange={set('cnh_cat')}>{CNH_CATS.map((c) => <option key={c} value={c}>{c || '—'}</option>)}</select></label>
          <label className="f">CNH · validade<input className="input" type="date" value={f.cnh_validade || ''} onChange={set('cnh_validade')} /></label>
        </div>
        <datalist id="uc-cargos">{CARGOS.map((c) => <option key={c} value={c} />)}</datalist>
        <label className="chk"><input type="checkbox" checked={f.ativo !== false} onChange={() => setF({ ...f, ativo: f.ativo === false })} />Ativo</label>
        <label className="f">Observações<textarea className="input" rows={2} value={f.notas || ''} onChange={set('notas')} /></label>
        {err && <small style={{ color: 'var(--bad)' }}>{err}</small>}
        <button className="btn primary">Salvar</button>
      </form>
    </Modal>
  );
}
