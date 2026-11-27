// Fornecedores da cidade: lista fixa usada na OS e no Formulário 02, com cadastro rápido.
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';

export const SUPPLIER_KINDS = ['Oficina mecânica', 'Auto elétrica', 'Funilaria e pintura', 'Borracharia', 'Autopeças', 'Concessionária', 'Posto de combustível', 'Outro'];

function NewSupplier({ tenant, onSaved, onCancel, initial = '' }) {
  const [f, setF] = useState({ name: initial, doc: '', phone: '', kind: SUPPLIER_KINDS[0] });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save() {
    if (!f.name.trim()) { setErr('Informe o nome do fornecedor.'); return; }
    try { onSaved(await api.addSupplier({ ...f, name: f.name.trim(), tenant_id: tenant.id })); } catch (x) { setErr(x.message); }
  }
  return (
    <div className="glass" style={{ padding: 12, display: 'grid', gap: 8, borderRadius: 14 }}>
      <b style={{ fontSize: 13 }}>Novo fornecedor</b>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input className="input" placeholder="Nome / razão social" value={f.name} onChange={set('name')} />
        <select className="input" value={f.kind} onChange={set('kind')}>{SUPPLIER_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
        <input className="input" placeholder="CNPJ" value={f.doc} onChange={set('doc')} />
        <input className="input" placeholder="Telefone" value={f.phone} onChange={set('phone')} />
      </div>
      {err && <small style={{ color: 'var(--bad)' }}>{err}</small>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn primary sm" onClick={save}>Salvar fornecedor</button>
        <button type="button" className="btn sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

// Campo de seleção: lista fixa + "Cadastrar novo fornecedor"
export function SupplierSelect({ tenant, value, onChange, disabled }) {
  const [list, setList] = useState([]);
  const [adding, setAdding] = useState(false);
  useEffect(() => { api.suppliers(tenant.id).then(setList); }, [tenant.id]);
  const known = !value || list.some((s) => s.name === value);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <select className="input" disabled={disabled} value={value || ''} onChange={(e) => (e.target.value === '__new' ? setAdding(true) : onChange(e.target.value))}>
        <option value="">Selecione o fornecedor</option>
        {!known && <option value={value}>{value}</option>}
        {list.map((s) => <option key={s.id} value={s.name}>{s.name} · {s.kind}</option>)}
        <option value="__new">+ Cadastrar novo fornecedor</option>
      </select>
      {adding && <NewSupplier tenant={tenant} onCancel={() => setAdding(false)} onSaved={(s) => { setList([...list, s].sort((a, b) => a.name.localeCompare(b.name))); setAdding(false); onChange(s.name); }} />}
    </div>
  );
}

// Aba "Fornecedores" do UNIfrotas
export default function Suppliers({ tenant, match }) {
  const [list, setList] = useState([]);
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => api.suppliers(tenant.id).then(setList), [tenant.id]);
  useEffect(() => { load(); }, [load]);
  const shown = list.filter((s) => match(s.name, s.kind, s.doc, s.phone));
  return (
    <div className="glass card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Fornecedores <span className="muted" style={{ fontWeight: 400 }}>· {shown.length}</span></h3>
        <button className="btn sm primary" onClick={() => setAdding(true)}><Plus size={14} />Novo fornecedor</button></div>
      {adding && <div style={{ marginBottom: 12 }}><NewSupplier tenant={tenant} onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} /></div>}
      <table className="t"><thead><tr><th>Nome</th><th>Tipo</th><th>CNPJ</th><th>Telefone</th></tr></thead>
        <tbody>{shown.map((s) => <tr key={s.id}><td><b>{s.name}</b></td><td>{s.kind}</td><td>{s.doc}</td><td>{s.phone}</td></tr>)}
          {!shown.length && <tr><td colSpan={4} className="muted">Nenhum fornecedor cadastrado ainda.</td></tr>}</tbody></table>
    </div>
  );
}
