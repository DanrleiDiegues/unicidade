import { useEffect, useState } from 'react';
import { Truck, Wrench, AlertTriangle, Fuel } from 'lucide-react';
import { api } from '../lib/api';
import { MODULES, STAGES } from '../lib/catalog';
import { Kpi, ModIcon, brl } from '../ui';
import { clima, ibgeIndicadores, tempo, fmtNum } from '../lib/cityData';
import { Map as MapIcon } from 'lucide-react';

export default function Hub({ tenant, user, onOpen }) {
  const [d, setD] = useState(null);
  const [wx, setWx] = useState(null); const [ind, setInd] = useState(null);
  useEffect(() => {
    if (tenant.lat) clima(tenant.lat, tenant.lng).then(setWx).catch(() => {});
    if (tenant.ibge) ibgeIndicadores(tenant.ibge).then(setInd).catch(() => {});
  }, [tenant.lat, tenant.lng, tenant.ibge]);
  const popI = ind?.find((x) => x.id === 29171);
  const hasFrotas = tenant.modules?.includes('frotas');

  useEffect(() => {
    if (!hasFrotas) { setD({}); return; }
    Promise.all([api.vehicles(tenant.id), api.orders(tenant.id), api.fuel(tenant.id)])
      .then(([vehicles, orders, fuel]) => setD({ vehicles, orders, fuel }));
  }, [tenant.id, hasFrotas]);

  const open = d?.orders?.filter((o) => !o.closed) || [];
  const months = [...Array(6)].map((_, i) => { const x = new Date(); x.setMonth(x.getMonth() - 5 + i); return x; });
  const spend = months.map((m) => (d?.fuel || []).filter((f) => { const t = new Date(f.date); return t.getMonth() === m.getMonth() && t.getFullYear() === m.getFullYear(); }).reduce((s, f) => s + f.value, 0));
  const max = Math.max(1, ...spend);
  const hour = new Date().getHours();

  return (
    <>
      <div className="hero">
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          {tenant.logo_url && <img src={tenant.logo_url} alt={`Brasão de ${tenant.name}`} style={{ height: 76 }} />}
          <div>
          <div className="eyebrow">Prefeitura de {tenant.name} · {tenant.uf}</div>
          <h1>{hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'}, {user.name.split(' ')[0]} <span>· visão da cidade</span></h1>
          </div>
        </div>
        <span className="badge">{tenant.plan === 'trial' ? 'Período de teste' : 'Plano gratuito'}</span>
      </div>

      {(wx?.current || popI) && (
        <button className="glass city-now" onClick={() => onOpen('mapa')}>
          {wx?.current && <div className="cn-wx"><span>{tempo(wx.current.weather_code, wx.current.is_day).ico}</span><div><b>{Math.round(wx.current.temperature_2m)}°C</b><small>{tempo(wx.current.weather_code, wx.current.is_day).txt} · máx {Math.round(wx.daily.temperature_2m_max[0])}° mín {Math.round(wx.daily.temperature_2m_min[0])}° · chuva {wx.daily.precipitation_probability_max[0]}%</small></div></div>}
          {popI?.valor && <div className="cn-pop"><b>{fmtNum(popI.valor)}</b><small>habitantes (IBGE {popI.ano})</small></div>}
          <span className="cn-go"><MapIcon size={16} />Abrir mapa da cidade →</span>
        </button>
      )}

      {hasFrotas && d?.vehicles && (
        <div className="grid kpis">
          <Kpi icon={<Truck size={15} />} label="Frota" value={d.vehicles.length} sub={`${d.vehicles.filter((v) => v.status === 'disponivel').length} disponíveis · ${d.vehicles.filter((v) => v.status === 'em_uso').length} em uso`} />
          <Kpi icon={<Wrench size={15} />} label="Em manutenção" value={d.vehicles.filter((v) => v.status === 'manutencao').length} sub={`${open.length} ordens abertas`} />
          <Kpi icon={<AlertTriangle size={15} />} label="Prioridade alta" value={open.filter((o) => o.priority === 'alta').length} sub="Ocorrências urgentes" />
          <Kpi icon={<Fuel size={15} />} label="Combustível no mês" value={brl(spend[5])} sub="Todas as secretarias" />
        </div>
      )}

      <div className="section-title"><h2>Módulos da cidade</h2><span className="muted" style={{ fontSize: 13 }}>Clique para abrir</span></div>
      <div className="grid modules">
        {MODULES.map((mod) => {
          const on = tenant.modules?.includes(mod.key);
          return (
            <button key={mod.key} className={`glass module ${on ? '' : 'locked'}`} onClick={() => onOpen(mod.key)}>
              <span className={`badge ${on ? 'on' : 'soon'}`}>{on ? 'Ativo' : mod.ready ? 'Disponível' : 'Em breve'}</span>
              <div className="m-icon"><ModIcon name={mod.icon} /></div>
              <div className="m-name">{mod.name}</div>
              <div className="m-desc">{mod.desc}</div>
            </button>
          );
        })}
      </div>

      {hasFrotas && d?.orders && (
        <div className="two" style={{ marginTop: 16 }}>
          <div className="glass card">
            <h3>Gasto com combustível · últimos 6 meses</h3>
            <div className="spark">{spend.map((v, i) => <i key={i} title={brl(v)} style={{ height: `${(v / max) * 100}%` }} />)}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }} className="muted">
              {months.map((m, i) => <span key={i}>{m.toLocaleDateString('pt-BR', { month: 'short' })}</span>)}
            </div>
          </div>
          <div className="glass card">
            <h3>Alertas da frota</h3>
            <div className="list">
              {open.slice(0, 4).map((o) => {
                const v = d.vehicles.find((x) => x.id === o.vehicle_id);
                return (
                  <div key={o.id} className="row">
                    <Wrench size={16} />
                    <div className="grow"><b>{o.title}</b><small>{v?.plate} · {v?.secretaria} · {STAGES[o.stage].name}</small></div>
                    <span className={`badge prio-${o.priority}`}>{o.priority}</span>
                  </div>
                );
              })}
              {!open.length && <span className="muted">Nenhuma pendência.</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
