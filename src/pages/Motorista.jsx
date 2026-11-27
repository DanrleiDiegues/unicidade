import { useCallback, useEffect, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { api } from '../lib/api';
import { STAGES, MAINT_TYPES } from '../lib/catalog';
import { Modal, fmtDate } from '../ui';
import { OrderView } from './Frotas';

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

  async function submit(e) {
    e.preventDefault();
    await api.createOrder({ ...form, tenant_id: tenant.id, by: user.id });
    setForm(null); notify('Ocorrência registrada. A gestão da frota já foi avisada.'); load();
  }

  return (
    <>
      <div className="hero">
        <div><div className="eyebrow">{tenant.name} · UNIfrotas · Motorista</div><h1>Minhas ocorrências</h1></div>
        <button className="btn primary" onClick={() => setForm({ vehicle_id: vehicles[0]?.id, title: '', description: '', priority: 'media', km: '', type: 'Corretiva' })}><Plus size={16} />Registrar ocorrência</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
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
        {!orders.length && <div className="glass card muted">Nenhuma ocorrência registrada ainda.</div>}
      </div>

      {form && (
        <Modal title="Registrar ocorrência" onClose={() => setForm(null)}>
          <form className="form" onSubmit={submit}>
            <label className="f">Veículo<select className="input" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}</select></label>
            <label className="f">O que aconteceu?<input className="input" required placeholder="Ex.: barulho no freio" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label className="f">Tipo<select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{MAINT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="f">Detalhes<textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div className="cols">
              <label className="f">Km atual<input className="input" type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} /></label>
              <label className="f">Prioridade<select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta — veículo parado</option></select></label>
            </div>
            <button className="btn primary">Enviar</button>
          </form>
        </Modal>
      )}
      {sel && <Modal title={sel.title} onClose={() => setSel(null)}><OrderView order={sel} vehicle={vehicles.find((v) => v.id === sel.vehicle_id)} /></Modal>}
    </>
  );
}
