import { useCallback, useEffect, useState } from 'react';
import { Lightbulb, Plus, Building2, Users, Mail, ExternalLink, RotateCcw, Pencil, MapPin, Upload, Check, Loader } from 'lucide-react';
import { SugestoesAdmin } from './Sugestoes';
import { UFS, ibgeMunicipios, localizarCidade, brasaoDataUrl } from '../lib/cityData';
import { api } from '../lib/api';
import { MODULES, ROLES } from '../lib/catalog';
import { Kpi, Modal, fmtDate } from '../ui';

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function Admin({ notify, onOpenTenant, refresh }) {
  const [tab, setTab] = useState('cities');
  const [tenants, setTenants] = useState([]);
  const [members, setMembers] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [city, setCity] = useState(null);
  const [inv, setInv] = useState(null);

  const load = useCallback(async () => {
    const [t, m, o] = await Promise.all([api.tenants(), api.members(), api.outbox()]);
    setTenants(t); setMembers(m); setOutbox(o); refresh?.();
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const toggleModule = async (t, key) => {
    const modules = t.modules.includes(key) ? t.modules.filter((k) => k !== key) : [...t.modules, key];
    await api.updateTenant(t.id, { modules }); load();
  };
  const saveCity = async (e) => {
    e.preventDefault();
    const { id, users, created_at, plan, ...data } = city; // eslint-disable-line no-unused-vars
    try {
      if (id) { await api.updateTenant(id, { name: data.name, uf: data.uf, ibge: data.ibge || null, lat: data.lat ?? null, lng: data.lng ?? null, logo_url: data.logo_url || null }); notify('Cidade atualizada.'); }
      else { await api.createTenant({ ...data, slug: data.slug || slugify(data.name) }); notify('Cidade criada.'); }
      setCity(null); load();
    } catch (x) { notify(x.message); }
  };
  const sendInvite = async (e) => {
    e.preventDefault();
    try { await api.invite(inv); setInv(null); notify(`Convite e boas-vindas enviados para ${inv.email}.`); load(); } catch (x) { notify(x.message); }
  };

  return (
    <>
      <div className="hero">
        <div><div className="eyebrow">Administração da plataforma</div><h1>Cidades UNIcidade</h1></div>
        <div className="tabs glass" style={{ padding: 5, margin: 0 }}>
          {[['cities', 'Cidades', Building2], ['users', 'Usuários', Users], ['sug', 'Sugestões', Lightbulb], ['mail', 'E-mails', Mail]].map(([k, l, I]) => (
            <button key={k} className={`btn sm ${tab === k ? 'primary' : 'ghost'}`} onClick={() => setTab(k)}><I size={14} />{l}</button>))}
        </div>
      </div>
      <div className="grid kpis" style={{ marginBottom: 16 }}>
        <Kpi label="Cidades" value={tenants.length} sub={`${tenants.filter((t) => t.plan === 'trial').length} em teste`} />
        <Kpi label="Usuários" value={members.length} />
        <Kpi label="Módulos ativos" value={tenants.reduce((s, t) => s + t.modules.length, 0)} />
        <Kpi label="E-mails enviados" value={outbox.length} />
      </div>

      {tab === 'cities' && (
        <>
          <div className="section-title"><h2>Cidades</h2><button className="btn primary sm" onClick={() => setCity({ name: '', slug: '', uf: 'MG', modules: ['frotas', 'mapa'] })}><Plus size={14} />Nova cidade</button></div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {tenants.map((t) => (
              <div key={t.id} className="glass card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {t.logo_url ? <img src={t.logo_url} alt="" style={{ height: 40 }} /> : <div className="brasao-vazio">sem brasão</div>}
                    <div><h3 style={{ marginBottom: 4 }}>{t.name} · {t.uf}</h3><small className="muted">{t.slug}.unicidade.com.br · {t.users} usuários</small>
                      <small style={{ display: 'block', color: t.ibge ? '#16a34a' : '#d97706' }}>{t.ibge ? `IBGE ${t.ibge} · mapa configurado` : 'Sem código IBGE: mapa e números vazios'}</small></div>
                  </div>
                  <span className="badge">{t.plan}</span>
                </div>
                <div className="chips" style={{ margin: '14px 0' }}>
                  {MODULES.map((m) => (
                    <button key={m.key} className={`badge ${t.modules.includes(m.key) ? 'on' : 'soon'}`} style={{ cursor: 'pointer' }} onClick={() => toggleModule(t, m.key)}>
                      {t.modules.includes(m.key) ? '✓ ' : ''}{m.name}</button>))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn sm" onClick={() => onOpenTenant(t.id)}><ExternalLink size={14} />Abrir</button>
                  <button className="btn sm" onClick={() => setInv({ name: '', email: '', tenant_id: t.id, role: 'geral' })}><Plus size={14} />Usuário</button>
                  <button className="btn sm" onClick={() => setCity({ ...t })}><Pencil size={14} />Editar</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="glass card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Usuários</h3>
            <button className="btn primary sm" onClick={() => setInv({ name: '', email: '', tenant_id: tenants[0]?.id, role: 'geral' })}><Plus size={14} />Convidar</button></div>
          <table className="t"><thead><tr><th>Nome</th><th>E-mail</th><th>Cidade</th><th>Perfil</th></tr></thead>
            <tbody>{members.map((m, i) => <tr key={i}><td>{m.user?.name}</td><td>{m.user?.email}</td><td>{m.tenant?.name}</td><td>{ROLES[m.role]?.label}</td></tr>)}</tbody></table>
        </div>
      )}

      {tab === 'sug' && <SugestoesAdmin notify={notify} />}
      {tab === 'mail' && (
        <div className="glass card"><h3>E-mails de boas-vindas</h3>
          <div className="list">{outbox.map((o) => <div key={o.id} className="row"><Mail size={16} /><div className="grow"><b>{o.subject}</b><small>{o.to} · {fmtDate(o.at)}</small></div></div>)}
            {!outbox.length && <span className="muted">Nenhum e-mail ainda. Eles saem no cadastro, no convite e no primeiro login.</span>}</div>
          {api.mode === 'demo' && <button className="btn sm" style={{ marginTop: 16 }} onClick={async () => { await api.reset(); notify('Demonstração restaurada.'); load(); }}><RotateCcw size={14} />Restaurar dados de demonstração</button>}
        </div>
      )}

      {city && (
        <Modal title={city.id ? `Editar · ${city.name}` : 'Nova cidade'} onClose={() => setCity(null)}>
          <CityForm city={city} setCity={setCity} onSubmit={saveCity} />
        </Modal>
      )}
      {inv && (
        <Modal title="Convidar usuário" onClose={() => setInv(null)}>
          <form className="form" onSubmit={sendInvite}>
            <label className="f">Nome<input className="input" required value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} /></label>
            <label className="f">E-mail<input className="input" type="email" required value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></label>
            <div className="cols">
              <label className="f">Cidade<select className="input" value={inv.tenant_id} onChange={(e) => setInv({ ...inv, tenant_id: e.target.value })}>{tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
              <label className="f">Perfil<select className="input" value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })}>{Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}</select></label>
            </div>
            <small className="muted">A pessoa recebe um e-mail de boas-vindas com o link de acesso.</small>
            <button className="btn primary">Enviar convite</button>
          </form>
        </Modal>
      )}
    </>
  );
}

function CityForm({ city, setCity, onSubmit }) {
  const [muns, setMuns] = useState([]);
  const [st, setSt] = useState({ busy: false, msg: '', ok: !!city.ibge });
  useEffect(() => { ibgeMunicipios(city.uf).then(setMuns).catch(() => setMuns([])); }, [city.uf]);
  async function localizar(nome = city.name, uf = city.uf) {
    if (!nome || !uf) return;
    setSt({ busy: true, msg: 'Buscando no IBGE…', ok: false });
    try {
      const r = await localizarCidade(nome, uf);
      setCity((c) => ({ ...c, name: r.nome, ibge: r.ibge, lat: r.lat, lng: r.lng, slug: c.id ? c.slug : slugify(r.nome) }));
      setSt({ busy: false, ok: true, msg: `IBGE ${r.ibge} · centro ${r.lat?.toFixed(4)}, ${r.lng?.toFixed(4)} (${r.fonte})` });
    } catch (x) { setSt({ busy: false, ok: false, msg: x.message }); }
  }
  async function brasao(e) {
    const f = e.target.files?.[0]; if (!f) return;
    try { const logo_url = await brasaoDataUrl(f); setCity((c) => ({ ...c, logo_url })); } catch (x) { setSt((s) => ({ ...s, msg: x.message })); }
  }
  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="cols">
        <label className="f">Nome do município<input className="input" required list="uc-muns" value={city.name}
          onChange={(e) => setCity({ ...city, name: e.target.value, ibge: null, slug: city.id ? city.slug : slugify(e.target.value) })}
          onBlur={() => !city.ibge && localizar()} /></label>
        <label className="f">UF<select className="input" value={city.uf} onChange={(e) => { setCity({ ...city, uf: e.target.value, ibge: null }); setSt({ busy: false, ok: false, msg: '' }); }}>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
      </div>
      <datalist id="uc-muns">{muns.map((m) => <option key={m.id} value={m.nome} />)}</datalist>
      <div className={`ibge-box ${st.ok || city.ibge ? 'ok' : ''}`}>
        {st.busy ? <Loader size={14} className="spin" /> : city.ibge ? <Check size={14} /> : <MapPin size={14} />}
        <span>{st.msg || (city.ibge ? `IBGE ${city.ibge} · centro ${city.lat}, ${city.lng}` : 'O código IBGE e o centro do mapa são preenchidos sozinhos ao escolher o município.')}</span>
        <button type="button" className="btn sm ghost" onClick={() => localizar()} disabled={st.busy || !city.name}>Buscar no IBGE</button>
      </div>
      {!city.id && <label className="f">Endereço<input className="input" value={city.slug} onChange={(e) => setCity({ ...city, slug: slugify(e.target.value) })} /><small>{city.slug || 'cidade'}.unicidade.com.br</small></label>}
      <div className="f">Brasão da prefeitura
        <div className="brasao-up">
          {city.logo_url ? <img src={city.logo_url} alt="Brasão" /> : <div className="brasao-vazio">sem brasão</div>}
          <label className="btn sm"><Upload size={14} />{city.logo_url ? 'Trocar imagem' : 'Enviar imagem'}<input type="file" accept="image/*" hidden onChange={brasao} /></label>
          {city.logo_url && <button type="button" className="btn sm ghost" onClick={() => setCity({ ...city, logo_url: null })}>Remover</button>}
        </div>
        <small className="muted">PNG com fundo transparente fica melhor. A imagem é reduzida para 256 px.</small>
      </div>
      {!city.id && <div className="chips">{MODULES.map((m) => (
        <button type="button" key={m.key} className={`badge ${city.modules.includes(m.key) ? 'on' : 'soon'}`} style={{ cursor: 'pointer' }}
          onClick={() => setCity({ ...city, modules: city.modules.includes(m.key) ? city.modules.filter((k) => k !== m.key) : [...city.modules, m.key] })}>
          {city.modules.includes(m.key) ? '✓ ' : ''}{m.name}</button>))}</div>}
      <button className="btn primary" disabled={st.busy}>{city.id ? 'Salvar cidade' : 'Criar cidade'}</button>
    </form>
  );
}
