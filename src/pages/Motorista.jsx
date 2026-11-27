import { useCallback, useEffect, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { api } from '../lib/api';
import { STAGES, MAINT_TYPES } from '../lib/catalog';
import { GRAVIDADE } from '../forms';
import { Modal, fmtDate } from '../ui';
import { OrderView } from './Frotas';
import Guide from './Guide';

export default function Motorista({ tenant, user, notify }) {
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(null);
  const [sel, setSel] = useState(null);

  const load = useCallback(async () => {
    const [v, o] = await Promise.all([api.vehicles(tenant.id), api.orders(tenant.id, user.id)]);
    setVehicles(v); setOrders(o);
  }, [tenant.id, user.id]);
  useEffect(() => { load(); }, [load]);


  return (
    <>
      <div className="hero">
        <div><div className="eyebrow">{tenant.name} · UNIfrotas · Motorista</div><h1>Minhas OS</h1></div>
        <button className="btn primary" onClick={() => setForm(true)}><Plus size={16} />Abrir OS</button>
      </div>
      <div className="with-guide"><div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {orders.map((o) => {
          const v = vehicles.find((x) => x.id === o.vehicle_id);
          return (
            <div key={o.id} className="glass card" style={{ cursor: 'pointer' }} onClick={() => setSel(o)}>
              <div className="t-top" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span className="muted">{v?.plate} · {fmtDate(o.created_at)}</span><span className={`prio-${o.priority}`}>● {o.priority}</span></div>
              <h3 style={{ margin: '8px 0' }}>{o.title}</h3>
              <div className="stepper">{STAGES.map((s, i) => <div key={i} className={i <= o.stage ? 'done' : ''} />)}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Wrench size={15} /><span>{o.cancelled ? 'Cancelada' : o.closed ? 'Concluída' : STAGES[o.stage].name}</span></div>
            </div>
          );
        })}
        {!orders.length && <div className="glass card muted">Nenhuma OS aberta ainda.</div>}
      </div><Guide kind="motorista" /></div>

      {form && <NewSmc tenant={tenant} user={user} vehicles={vehicles} count={orders.length} onClose={() => setForm(null)} onDone={() => { setForm(null); notify('OS aberta (Formulário 01 · SMC). A gestão da frota já foi avisada.'); load(); }} />}
      {sel && <Modal title={sel.title} onClose={() => setSel(null)}><OrderView order={sel} tenant={tenant} vehicle={vehicles.find((v) => v.id === sel.vehicle_id)} /></Modal>}
    </>
  );
}

// Formulário 01 · SMC: é a própria abertura da ocorrência (motorista ou gestão).
export function NewSmc({ tenant, user, vehicles, count, onClose, onDone }) {
  const today = new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso local
  const [f, setF] = useState({ vehicle_id: vehicles[0]?.id, setor: '', motorista: user.name, km: '', title: '', defeito: '', gravidade: 'media', type: 'Corretiva'});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const numero = `${new Date().getFullYear()}/${String(count + 1).padStart(4, '0')}`;
  async function submit(e) {
    e.preventDefault();
    const data = { numero, data: today, setor: f.setor, motorista: f.motorista, hodometro: f.km, defeito: f.defeito || f.title, gravidade: f.gravidade, ass_motorista: { nome: f.motorista, ok: true, em: new Date().toISOString() } };
    await api.createOrder({ tenant_id: tenant.id, vehicle_id: f.vehicle_id, title: f.title, description: f.defeito, priority: f.gravidade, km: f.km, type: f.type, by: user.id,
      forms: { smc: { data, done: false, at: new Date().toISOString() } } });
    onDone();
  }
  return (
    <Modal title={`Abrir OS nº ${numero}`} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="demo-hint">A abertura da OS é feita pelo <b>Formulário 01 · SMC (Solicitação de Manutenção Corretiva)</b> da prefeitura. Depois de enviada, a gestão da frota autoriza a OS e ela segue pelo kanban.</div>
        <label className="f">Veículo<select className="input" value={f.vehicle_id} onChange={set('vehicle_id')}>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}</select></label>
        <div className="cols">
          <label className="f">Setor solicitante<input className="input" required value={f.setor} onChange={set('setor')} /></label>
          <label className="f">Motorista<input className="input" required value={f.motorista} onChange={set('motorista')} /></label>
          <label className="f">Hodômetro (km)<input className="input" type="number" value={f.km} onChange={set('km')} /></label>
          <label className="f">Tipo<select className="input" value={f.type} onChange={set('type')}>{MAINT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        </div>
        <label className="f">Resumo do problema<input className="input" required placeholder="Barulho no freio traseiro" value={f.title} onChange={set('title')} /></label>
        <label className="f">Descrição do defeito<textarea className="input" rows={3} value={f.defeito} onChange={set('defeito')} /></label>
        <div className="f"><span>Classificação da gravidade</span>{GRAVIDADE.map(([v, l]) => (
          <label key={v} style={{ display: 'flex', gap: 8, color: 'var(--text)' }}><input type="radio" name="grav" checked={f.gravidade === v} onChange={() => setF({ ...f, gravidade: v })} />{l}</label>))}</div>
        <button className="btn primary">Abrir OS</button>
      </form>
    </Modal>
  );
}
