import { useCallback, useEffect, useState } from 'react';
import { Plus, Wrench, Car, Fuel, CheckCircle2, Circle, ChevronRight, ChevronLeft, ArrowLeftRight, Check, Ban } from 'lucide-react';
import { api } from '../lib/api';
import { STAGES, VEHICLE_TYPES, VEHICLE_STATUS, FORM_TASK } from '../lib/catalog';
import { FORMS, FormModal } from '../forms';
import { NewSmc } from './Motorista';
import { Modal, fmtDate, brl } from '../ui';

export function OrderView({ order, vehicle, tenant, editable, onChange }) {
  const [form, setForm] = useState(null);
  const saveForm = (f, data, done) => {
    const forms = { ...(order.forms || {}), [f.key]: { data, done: done || order.forms?.[f.key]?.done || false, at: new Date().toISOString() } };
    const tasks = done ? order.tasks.map((t) => (t.label === FORM_TASK[f.key] ? { ...t, done: true } : t)) : order.tasks;
    onChange({ forms, tasks }, `${done ? 'Concluído' : 'Rascunho salvo'}: Formulário ${f.code} · ${f.title}`);
    setForm(null);
  };
  const stageTasks = order.tasks.filter((t) => t.stage === order.stage);
  const allDone = stageTasks.every((t) => t.done);
  const setTask = (id, patch, note) => onChange({ tasks: order.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)) }, note);
  const toggle = (t) => setTask(t.id, { done: !t.done }, `${t.done ? 'Reaberta' : 'Concluída'}: ${t.label}${t.note ? ` — ${t.note}` : ''}`);
  const move = (dir) => onChange({ stage: order.stage + dir }, dir > 0 ? `Etapa: ${STAGES[order.stage + 1].name}` : `Devolvida para ajustes: ${STAGES[order.stage - 1].name}`);
  const status = order.cancelled ? 'Cancelada' : order.closed ? 'Concluída' : `Etapa ${order.stage + 1} de 6 · ${STAGES[order.stage].name}`;
  const ro = !editable || order.closed;
  return (
    <>
      <div className="muted" style={{ fontSize: 13 }}>{vehicle?.plate} · {vehicle?.model} · {vehicle?.secretaria} · {order.type || 'Corretiva'} · aberta em {fmtDate(order.created_at)}</div>
      <div className="stepper">{STAGES.map((s, i) => <div key={i} title={s.name} className={i < order.stage || (i === order.stage && (allDone || order.closed)) ? 'done' : ''} />)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b>{status}</b><span className={`badge prio-${order.priority}`}>prioridade {order.priority}</span>
      </div>
      {order.description && <p className="muted">{order.description}</p>}
      {editable && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <label className="f">Oficina / fornecedor<input className="input" disabled={ro} defaultValue={order.oficina} onBlur={(e) => e.target.value !== order.oficina && onChange({ oficina: e.target.value })} /></label>
          <label className="f">Valor (R$)<input className="input" type="number" disabled={ro} defaultValue={order.value || ''} onBlur={(e) => Number(e.target.value) !== order.value && onChange({ value: Number(e.target.value) }, `Valor: ${brl(Number(e.target.value))}`)} /></label>
        </div>
      )}
      <div style={{ margin: '12px 0' }}>
        {stageTasks.map((t) => (
          <div key={t.id} className={`task ${t.done ? 'done' : ''}`}>
            <span onClick={() => !ro && toggle(t)} style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, textDecoration: 'none' }}>
              {t.done ? <CheckCircle2 size={18} color="var(--ok)" /> : <Circle size={18} />}<span>{t.label}</span></span>
            {editable && !ro && <input className="input" style={{ width: 170, padding: '6px 10px', fontSize: 13 }} placeholder="Nº / observação" defaultValue={t.note || ''} onBlur={(e) => e.target.value !== (t.note || '') && setTask(t.id, { note: e.target.value })} />}
            {ro && t.note && <small className="muted">{t.note}</small>}
          </div>
        ))}
      </div>
      {editable && !order.closed && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn sm" disabled={order.stage === 0} onClick={() => move(-1)}><ChevronLeft size={14} />Devolver para ajustes</button>
            <button className="btn sm" onClick={() => onChange({ closed: true, cancelled: true }, 'Manutenção cancelada')}><Ban size={14} />Cancelar</button>
          </div>
          {order.stage < 5
            ? <button className="btn primary sm" disabled={!allDone} title={allDone ? '' : 'Conclua as tarefas da etapa'} onClick={() => move(1)}>Avançar etapa<ChevronRight size={14} /></button>
            : <button className="btn primary sm" disabled={!allDone} onClick={() => onChange({ closed: true }, 'Manutenção concluída e paga')}><Check size={14} />Concluir</button>}
        </div>
      )}
      <h4 style={{ marginBottom: 6 }}>Formulários</h4>
      <div className="list">{FORMS.map((f) => {
        const st = order.forms?.[f.key];
        const here = f.stage === order.stage;
        return (
          <div key={f.key} className="row" style={{ opacity: f.stage > order.stage && !st ? 0.55 : 1, cursor: 'pointer' }} onClick={() => setForm(f)}>
            <span className="badge">{f.code}</span>
            <div className="grow"><b style={{ fontSize: 14 }}>{f.title}</b><small>Etapa {f.stage + 1} · {STAGES[f.stage].name}{here ? ' · etapa atual' : ''}</small></div>
            <span className={`badge ${st?.done ? 'on' : st ? 'prio-media' : 'soon'}`}>{st?.done ? 'concluído' : st ? 'rascunho' : 'pendente'}</span>
          </div>
        );
      })}</div>
      {form && <FormModal form={form} order={order} vehicle={vehicle} tenant={tenant} editable={editable && !order.closed} onSave={(d, done) => saveForm(form, d, done)} onClose={() => setForm(null)} />}
      <h4 style={{ marginBottom: 6 }}>Histórico</h4>
      <div className="list">{[...order.history].reverse().map((h, i) => <div key={i} className="muted" style={{ fontSize: 13 }}>{fmtDate(h.at)} — {h.text}</div>)}</div>
    </>
  );
}

export default function Frotas({ tenant, user, notify }) {
  const [tab, setTab] = useState('manut');
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [sel, setSel] = useState(null);
  const [newCar, setNewCar] = useState(null);
  const [moves, setMoves] = useState([]);
  const [mv, setMv] = useState(null);
  const [smc, setSmc] = useState(false);

  const load = useCallback(async () => {
    const [v, o, f, m] = await Promise.all([api.vehicles(tenant.id), api.orders(tenant.id), api.fuel(tenant.id), api.moves(tenant.id)]);
    setVehicles(v); setOrders(o); setFuel(f); setMoves(m);
  }, [tenant.id]);
  useEffect(() => { load(); }, [load]);

  const vOf = (id) => vehicles.find((v) => v.id === id);
  const update = async (patch, note) => { const o = await api.updateOrder(sel.id, patch, note); setSel({ ...o }); load(); };
  const saveMove = async (e) => { e.preventDefault(); await api.checkout({ ...mv, tenant_id: tenant.id }); setMv(null); notify('Saída registrada.'); load(); };
  const giveBack = async (m) => { await api.checkin(m.id, m._km || vOf(m.vehicle_id)?.km); notify('Devolução registrada.'); load(); };
  const addCar = async (e) => { e.preventDefault(); await api.addVehicle({ ...newCar, tenant_id: tenant.id, km: Number(newCar.km || 0) }); setNewCar(null); notify('Veículo cadastrado.'); load(); };

  return (
    <>
      <div className="hero">
        <div><div className="eyebrow">{tenant.name} · UNIfrotas</div><h1>Gestão da frota <span>· {vehicles.length} veículos</span></h1></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={() => setSmc(true)}><Plus size={16} />Nova SMC</button>
        <div className="tabs glass" style={{ padding: 5, margin: 0 }}>
          {[['manut', 'Manutenção', Wrench], ['mov', 'Movimentações', ArrowLeftRight], ['veic', 'Veículos', Car], ['fuel', 'Abastecimento', Fuel]].map(([k, l, I]) => (
            <button key={k} className={`btn sm ${tab === k ? 'primary' : 'ghost'}`} onClick={() => setTab(k)}><I size={14} />{l}</button>
          ))}
        </div>
        </div>
      </div>
      {smc && <NewSmc tenant={tenant} user={user} vehicles={vehicles} count={orders.length} onClose={() => setSmc(false)} onDone={() => { setSmc(false); notify('SMC registrada na etapa Solicitação.'); load(); }} />}

      {tab === 'manut' && (
        <div className="kanban">
          {STAGES.map((s, i) => {
            const list = orders.filter((o) => o.stage === i && !o.cancelled);
            return (
              <div key={s.name} className="glass col">
                <div className="col-head"><span>{i + 1}. {s.name}</span><span className="n">{list.length}</span></div>
                {list.map((o) => {
                  const tk = o.tasks.filter((t) => t.stage === i); const done = tk.filter((t) => t.done).length;
                  return (
                    <div key={o.id} className="ticket" onClick={() => setSel(o)}>
                      <div className="t-top"><span>{vOf(o.vehicle_id)?.plate}</span>{o.closed ? <span className="badge on">concluída</span> : <span className={`prio-${o.priority}`}>● {o.priority}</span>}</div>
                      <div className="t-title">{o.title}</div>
                      <div className="bar"><i style={{ width: `${tk.length ? (done / tk.length) * 100 : 100}%` }} /></div>
                      <div className="t-top"><span>{done}/{tk.length} tarefas</span><span>{fmtDate(o.created_at)}</span></div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'veic' && (
        <div className="glass card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Veículos</h3>
            <button className="btn sm primary" onClick={() => setNewCar({ plate: '', model: '', type: 'Outro', secretaria: '', km: '', year: '' })}><Plus size={14} />Novo veículo</button></div>
          <table className="t"><thead><tr><th>Placa</th><th>Modelo</th><th>Tipo</th><th>Secretaria</th><th>Km</th><th>Situação</th></tr></thead>
            <tbody>{vehicles.map((v) => (
              <tr key={v.id}><td><b>{v.plate}</b></td><td>{v.model}</td><td>{v.type}</td><td>{v.secretaria}</td><td>{Number(v.km).toLocaleString('pt-BR')}</td>
                <td><span className={`badge ${v.status === 'disponivel' ? 'on' : 'prio-media'}`}>{VEHICLE_STATUS[v.status] || v.status}</span></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'mov' && (
        <div className="glass card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Saídas e devoluções</h3>
            <button className="btn sm primary" onClick={() => { const v = vehicles.find((x) => x.status === 'disponivel'); setMv({ vehicle_id: v?.id, setor: '', finalidade: '', driver: '', km_out: v?.km || '' }); }}><Plus size={14} />Registrar saída</button></div>
          <table className="t"><thead><tr><th>Veículo</th><th>Setor</th><th>Finalidade</th><th>Responsável</th><th>Saída</th><th>Km</th><th></th></tr></thead>
            <tbody>{moves.map((m) => (
              <tr key={m.id}><td><b>{vOf(m.vehicle_id)?.plate}</b></td><td>{m.setor}</td><td>{m.finalidade}</td><td>{m.driver}</td><td>{fmtDate(m.out_at)}</td>
                <td>{m.km_out}{m.km_in ? ` → ${m.km_in}` : ''}</td>
                <td>{m.in_at ? <span className="badge on">devolvido</span> : (
                  <span style={{ display: 'flex', gap: 6 }}><input className="input" style={{ width: 100, padding: '5px 8px' }} type="number" placeholder="Km retorno" onChange={(e) => (m._km = e.target.value)} />
                    <button className="btn sm" onClick={() => giveBack(m)}>Devolver</button></span>)}</td></tr>
            ))}{!moves.length && <tr><td colSpan={7} className="muted">Nenhuma movimentação.</td></tr>}</tbody></table>
        </div>
      )}

      {tab === 'fuel' && (
        <div className="glass card"><h3>Abastecimentos recentes</h3>
          <table className="t"><thead><tr><th>Data</th><th>Veículo</th><th>Litros</th><th>Valor</th></tr></thead>
            <tbody>{[...fuel].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map((f) => (
              <tr key={f.id}><td>{fmtDate(f.date)}</td><td>{vOf(f.vehicle_id)?.plate} · {vOf(f.vehicle_id)?.model}</td><td>{f.liters} L</td><td>{brl(f.value)}</td></tr>
            ))}</tbody></table>
        </div>
      )}

      {sel && <Modal title={sel.title} onClose={() => setSel(null)}><OrderView order={sel} vehicle={vOf(sel.vehicle_id)} tenant={tenant} editable onChange={update} /></Modal>}
      {mv && (
        <Modal title="Registrar saída de veículo" onClose={() => setMv(null)}>
          <form className="form" onSubmit={saveMove}>
            <label className="f">Veículo<select className="input" value={mv.vehicle_id} onChange={(e) => setMv({ ...mv, vehicle_id: e.target.value, km_out: vOf(e.target.value)?.km })}>
              {vehicles.filter((v) => v.status === 'disponivel').map((v) => <option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}</select></label>
            <div className="cols">
              <label className="f">Setor de destino<input className="input" required value={mv.setor} onChange={(e) => setMv({ ...mv, setor: e.target.value })} /></label>
              <label className="f">Responsável<input className="input" required value={mv.driver} onChange={(e) => setMv({ ...mv, driver: e.target.value })} /></label>
            </div>
            <label className="f">Finalidade<input className="input" required value={mv.finalidade} onChange={(e) => setMv({ ...mv, finalidade: e.target.value })} /></label>
            <label className="f">Km de saída<input className="input" type="number" required value={mv.km_out} onChange={(e) => setMv({ ...mv, km_out: e.target.value })} /></label>
            <button className="btn primary">Registrar saída</button>
          </form>
        </Modal>
      )}
      {newCar && (
        <Modal title="Novo veículo" onClose={() => setNewCar(null)}>
          <form className="form" onSubmit={addCar}>
            <div className="cols">
              {[['plate', 'Placa'], ['model', 'Modelo'], ['secretaria', 'Secretaria'], ['km', 'Km atual'], ['year', 'Ano']].map(([k, l]) => (
                <label key={k} className="f">{l}<input className="input" required={k !== 'year'} value={newCar[k]} onChange={(e) => setNewCar({ ...newCar, [k]: e.target.value })} /></label>
              ))}
              <label className="f">Tipo<select className="input" value={newCar.type} onChange={(e) => setNewCar({ ...newCar, type: e.target.value })}>
                {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            </div>
            <button className="btn primary">Salvar</button>
          </form>
        </Modal>
      )}
    </>
  );
}
