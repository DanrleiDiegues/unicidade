// Mapa da cidade: limite do IBGE, prédios públicos, frota por secretaria, ocorrências, clima e indicadores.
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Layers, Satellite, Map as MapIcon, Plus, Crosshair, ExternalLink, LocateFixed } from 'lucide-react';
import { api } from '../lib/api';
import { STAGES } from '../lib/catalog';
import { ibgeMalha, ibgeIndicadores, clima, tempo, fmtNum } from '../lib/cityData';
import { Modal } from '../ui';

export const PLACE_KINDS = {
  prefeitura: ['Prefeitura / gabinete', '🏛️', '#4f46e5', 'Gabinete'],
  saude: ['Saúde', '🏥', '#e11d48', 'Saúde'],
  educacao: ['Educação', '🏫', '#d97706', 'Educação'],
  garagem: ['Garagem da frota', '🚚', '#0891b2', ''],
  obras: ['Obras e estradas', '🚧', '#ea580c', 'Obras'],
  social: ['Assistência social', '🤝', '#7c3aed', 'Assistência'],
  esporte: ['Esporte e lazer', '⚽', '#16a34a', 'Esporte'],
  outro: ['Outro', '📍', '#475569', ''],
};
const PRIO = { alta: '#dc2626', media: '#f59e0b', baixa: '#16a34a' };
const TILES = {
  mapa: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png', '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'],
  sat: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', '© Esri, Maxar, Earthstar Geographics'],
};
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const sameSec = (a, b) => !!a && !!b && (norm(a).includes(norm(b)) || norm(b).includes(norm(a)));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const center = (t) => [t.lat ?? -15.78, t.lng ?? -47.93];

function baseMap(el, t, zoom = 13) {
  const map = L.map(el, { zoomControl: false, attributionControl: true }).setView(center(t), zoom);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  return map;
}

// Mini mapa para escolher um ponto (usado na abertura da OS)
export function PointPicker({ tenant, value, onChange }) {
  const el = useRef(null); const mk = useRef(null); const map = useRef(null);
  useEffect(() => {
    const m = baseMap(el.current, tenant, 13); map.current = m;
    L.tileLayer(TILES.mapa[0], { attribution: TILES.mapa[1], maxZoom: 19 }).addTo(m);
    m.on('click', (e) => onChange({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) }));
    setTimeout(() => m.invalidateSize(), 150);
    return () => m.remove();
  }, [tenant.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!map.current) return;
    if (mk.current) { mk.current.remove(); mk.current = null; }
    if (value?.lat) { mk.current = L.marker([value.lat, value.lng], { icon: pulseIcon('media') }).addTo(map.current); map.current.panTo([value.lat, value.lng]); }
  }, [value?.lat, value?.lng]);
  const gps = () => navigator.geolocation?.getCurrentPosition((p) => onChange({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }), () => alert('Não foi possível obter a localização.'));
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div ref={el} className="picker" />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" className="btn sm" onClick={gps}><LocateFixed size={14} />Usar minha localização</button>
        <small className="muted">{value?.lat ? `Marcado: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Toque no mapa para marcar onde está o problema (opcional).'}</small>
      </div>
    </div>
  );
}

const pulseIcon = (p) => L.divIcon({ className: '', html: `<div class="pulse" style="--c:${PRIO[p] || PRIO.media}"><i></i></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
const placeIcon = (k, n) => { const [, e, c] = PLACE_KINDS[k] || PLACE_KINDS.outro; return L.divIcon({ className: '', html: `<div class="pin" style="--c:${c}"><span>${e}</span>${n ? `<b>${n}</b>` : ''}</div>`, iconSize: [38, 46], iconAnchor: [19, 44], popupAnchor: [0, -40] }); };

export default function Mapa({ tenant, role, notify, onOpenFrotas }) {
  const el = useRef(null); const map = useRef(null); const base = useRef(null); const groups = useRef({});
  const [places, setPlaces] = useState([]); const [vehicles, setVehicles] = useState([]); const [orders, setOrders] = useState([]);
  const [malha, setMalha] = useState(null); const [ind, setInd] = useState(null); const [wx, setWx] = useState(null);
  const [layers, setLayers] = useState({ limite: true, locais: true, frota: true, ocorr: true });
  const [bg, setBg] = useState('mapa'); const [mode, setMode] = useState(null); const [draft, setDraft] = useState(null);
  const canEdit = role === 'geral';
  const ibge = tenant.ibge;

  const load = () => Promise.all([api.places(tenant.id), api.vehicles(tenant.id), api.orders(tenant.id)]).then(([p, v, o]) => { setPlaces(p); setVehicles(v); setOrders(o); });
  useEffect(() => { load(); }, [tenant.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (ibge) { ibgeMalha(ibge).then(setMalha).catch(() => setMalha(false)); ibgeIndicadores(ibge).then(setInd).catch(() => setInd(false)); }
    if (tenant.lat) clima(tenant.lat, tenant.lng).then(setWx).catch(() => setWx(false));
  }, [ibge, tenant.lat, tenant.lng]);

  // mapa
  useEffect(() => {
    const m = baseMap(el.current, tenant, 16); map.current = m;
    ['limite', 'locais', 'ocorr'].forEach((k) => (groups.current[k] = L.layerGroup().addTo(m)));
    m.on('popupopen', (e) => e.popup.getElement()?.querySelectorAll('[data-os]').forEach((b) => (b.onclick = () => onOpenFrotas?.())));
    setTimeout(() => m.invalidateSize(), 200);
    return () => m.remove();
  }, [tenant.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (base.current) base.current.remove();
    base.current = L.tileLayer(TILES[bg][0], { attribution: TILES[bg][1], maxZoom: 19 }).addTo(map.current);
    base.current.bringToBack();
  }, [bg]);
  useEffect(() => {
    const m = map.current; if (!m) return;
    m.getContainer().style.cursor = mode ? 'crosshair' : '';
    const h = (e) => { if (!mode) return; const pt = { lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) };
      if (mode.type === 'place') setDraft({ ...pt, name: '', kind: 'saude', secretaria: 'Saúde' });
      else api.updateOrder(mode.id, pt, 'Local da ocorrência marcado no mapa').then(() => { notify?.('Local da OS marcado no mapa.'); load(); });
      setMode(null); };
    m.on('click', h); return () => m.off('click', h);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // limite do município (IBGE) com máscara fora da cidade
  useEffect(() => {
    const g = groups.current.limite; if (!g) return; g.clearLayers();
    if (!malha || !layers.limite) return;
    const geom = malha.features?.[0]?.geometry; if (!geom) return;
    const rings = (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates).map((p) => p[0].map(([x, y]) => [y, x]));
    L.polygon([[[-89, -179], [-89, 179], [89, 179], [89, -179]], ...rings], { stroke: false, fillColor: '#0f172a', fillOpacity: 0.28, interactive: false }).addTo(g);
    L.polygon(rings, { color: '#2563eb', weight: 3, dashArray: '8 6', fill: false, interactive: false }).addTo(g);
  }, [malha, layers.limite]);

  const open = orders.filter((o) => !o.closed && !o.cancelled);
  const vehOf = (p) => (p.kind === 'garagem' ? vehicles.filter((v) => v.status === 'manutencao') : vehicles.filter((v) => sameSec(v.secretaria, p.secretaria)));

  // prédios públicos + frota
  useEffect(() => {
    const g = groups.current.locais; if (!g) return; g.clearLayers();
    if (!layers.locais) return;
    places.forEach((p) => {
      const vs = vehOf(p);
      const os = open.filter((o) => vs.some((v) => v.id === o.vehicle_id));
      const k = PLACE_KINDS[p.kind] || PLACE_KINDS.outro;
      const cnt = (s) => vs.filter((v) => v.status === s).length;
      const html = `<div class="pop"><small>${k[1]} ${esc(k[0])}</small><b>${esc(p.name)}</b>${p.secretaria ? `<span>Secretaria: ${esc(p.secretaria)}</span>` : ''}
        ${vs.length ? `<div class="pop-k"><div><b>${vs.length}</b>${p.kind === 'garagem' ? 'na oficina' : 'veículos'}</div><div><b>${cnt('disponivel')}</b>disponíveis</div><div><b>${cnt('em_uso')}</b>em uso</div><div><b>${cnt('manutencao')}</b>manutenção</div></div>` : ''}
        ${os.length ? `<div class="pop-l">${os.slice(0, 4).map((o) => `• ${esc(o.title)}`).join('<br>')}</div><button class="btn sm primary" data-os="1">Ver ${os.length} OS no UNIfrotas</button>` : ''}
        ${canEdit ? '<em>Arraste o marcador para ajustar a posição.</em>' : ''}</div>`;
      const mk = L.marker([p.lat, p.lng], { icon: placeIcon(p.kind, layers.frota ? vs.length : 0), draggable: canEdit, title: p.name }).bindPopup(html, { maxWidth: 280 });
      mk.on('dragend', (e) => { const { lat, lng } = e.target.getLatLng(); api.updatePlace(p.id, { lat: +lat.toFixed(6), lng: +lng.toFixed(6) }).then(load); });
      mk.addTo(g);
    });
  }, [places, vehicles, orders, layers.locais, layers.frota]); // eslint-disable-line react-hooks/exhaustive-deps

  // ocorrências (OS abertas com local)
  useEffect(() => {
    const g = groups.current.ocorr; if (!g) return; g.clearLayers();
    if (!layers.ocorr) return;
    open.filter((o) => o.lat).forEach((o) => {
      const v = vehicles.find((x) => x.id === o.vehicle_id);
      const num = o.forms?.smc?.data?.numero;
      L.marker([o.lat, o.lng], { icon: pulseIcon(o.priority), zIndexOffset: 500 }).bindPopup(
        `<div class="pop"><small>Ocorrência${num ? ` · OS ${esc(num)}` : ''}</small><b>${esc(o.title)}</b><span>${esc(v?.plate)} · ${esc(v?.model)} · ${esc(v?.secretaria)}</span>
        <span>Etapa: <b>${esc(STAGES[o.stage]?.name)}</b> · prioridade <b style="color:${PRIO[o.priority]}">${esc(o.priority)}</b></span><button class="btn sm primary" data-os="1">Abrir no UNIfrotas</button></div>`, { maxWidth: 280 }).addTo(g);
    });
  }, [orders, vehicles, layers.ocorr]); // eslint-disable-line react-hooks/exhaustive-deps

  const semLocal = open.filter((o) => !o.lat);
  const rain = useMemo(() => {
    if (!wx?.daily) return null;
    const i = wx.daily.time.findIndex((_, k) => wx.daily.precipitation_probability_max[k] >= 70 || wx.daily.precipitation_sum[k] >= 20);
    return i < 0 ? null : { dia: i === 0 ? 'hoje' : i === 1 ? 'amanhã' : new Date(wx.daily.time[i] + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long' }), mm: wx.daily.precipitation_sum[i], p: wx.daily.precipitation_probability_max[i] };
  }, [wx]);
  const pop = ind && ind.find((x) => x.id === 29171); const area = ind && ind.find((x) => x.id === 29167);

  async function savePlace(e) {
    e.preventDefault();
    await api.addPlace({ tenant_id: tenant.id, ...draft });
    setDraft(null); notify?.('Local adicionado ao mapa.'); load();
  }

  return (
    <div className="map-page">
      <div className="glass map-box">
        <div ref={el} className="map" />
        <div className="map-top">
          <div className="glass seg">
            <button className={bg === 'mapa' ? 'on' : ''} onClick={() => setBg('mapa')}><MapIcon size={14} />Mapa</button>
            <button className={bg === 'sat' ? 'on' : ''} onClick={() => setBg('sat')}><Satellite size={14} />Satélite</button>
          </div>
          <div className="glass seg">
            <button onClick={() => map.current.setView(center(tenant), 16)}><Crosshair size={14} />Centro</button>
            <button onClick={() => { const b = groups.current.limite.getLayers()[1]; if (b) map.current.fitBounds(b.getBounds(), { padding: [20, 20] }); }}><Layers size={14} />Município todo</button>
          </div>
          {mode && <div className="glass hint-bar"><Crosshair size={14} />{mode.type === 'place' ? 'Clique no mapa onde fica o novo local' : 'Clique no mapa onde está a ocorrência'}<button className="btn sm ghost" onClick={() => setMode(null)}>Cancelar</button></div>}
        </div>
        {wx?.current && (
          <div className="glass wx-float">
            <span className="wx-ico">{tempo(wx.current.weather_code, wx.current.is_day).ico}</span>
            <div><b>{Math.round(wx.current.temperature_2m)}°C</b><small>{tempo(wx.current.weather_code, wx.current.is_day).txt} · agora em {tenant.name}</small></div>
          </div>
        )}
      </div>

      <aside className="map-side">
        <div className="glass card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Layers size={16} />Camadas</h3>
          {[['limite', 'Limite do município (IBGE)'], ['locais', `Prédios públicos · ${places.length}`], ['frota', 'Frota por secretaria'], ['ocorr', `Ocorrências abertas · ${open.filter((o) => o.lat).length}`]].map(([k, l]) => (
            <label key={k} className="chk"><input type="checkbox" checked={layers[k]} onChange={() => setLayers({ ...layers, [k]: !layers[k] })} />{l}</label>))}
          <div className="legend">{Object.entries(PLACE_KINDS).map(([k, [l, e]]) => <span key={k}>{e} {l}</span>)}
            <span><i className="dot" style={{ background: PRIO.alta }} />OS prioridade alta</span><span><i className="dot" style={{ background: PRIO.media }} />média</span><span><i className="dot" style={{ background: PRIO.baixa }} />baixa</span></div>
          {canEdit && <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <button className="btn sm primary" onClick={() => setMode({ type: 'place' })}><Plus size={14} />Adicionar prédio público</button>
            {semLocal.length > 0 && <select className="input" value="" onChange={(e) => e.target.value && setMode({ type: 'os', id: e.target.value })}>
              <option value="">📍 Marcar local de uma OS ({semLocal.length} sem local)</option>
              {semLocal.map((o) => <option key={o.id} value={o.id}>{o.forms?.smc?.data?.numero ? `OS ${o.forms.smc.data.numero} · ` : ''}{o.title}</option>)}</select>}
          </div>}
        </div>

        <div className="glass card">
          <h3>Clima em {tenant.name}</h3>
          {wx === null && <span className="muted">Carregando previsão…</span>}
          {wx === false && <span className="muted">Previsão indisponível no momento.</span>}
          {wx?.current && <>
            <div className="wx-now">
              <span className="wx-big">{tempo(wx.current.weather_code, wx.current.is_day).ico}</span>
              <div><b>{Math.round(wx.current.temperature_2m)}°C</b><small>Sensação {Math.round(wx.current.apparent_temperature)}° · umidade {wx.current.relative_humidity_2m}% · vento {Math.round(wx.current.wind_speed_10m)} km/h</small></div>
            </div>
            <Next24 wx={wx} />
            <div className="wx-days">{wx.daily.time.map((d, i) => (
              <div key={d}><small>{i === 0 ? 'Hoje' : new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</small>
                <span>{tempo(wx.daily.weather_code[i]).ico}</span><b>{Math.round(wx.daily.temperature_2m_max[i])}°</b><small>{Math.round(wx.daily.temperature_2m_min[i])}°</small>
                <small className="rain">💧{wx.daily.precipitation_probability_max[i]}%</small></div>))}</div>
            {rain && <div className="alert">⚠️ Chuva forte prevista para <b>{rain.dia}</b> ({fmtNum(rain.mm, 0)} mm, {rain.p}%). Atenção às estradas rurais e ao uso da frota.</div>}
          </>}
          <small className="muted src">Fonte: Open-Meteo (dados abertos)</small>
        </div>

        <div className="glass card">
          <h3>{tenant.name} em números</h3>
          {!ibge && <span className="muted">Código IBGE da cidade não configurado.</span>}
          {ibge && ind === null && <span className="muted">Buscando dados do IBGE…</span>}
          {ind === false && <span className="muted">IBGE indisponível no momento.</span>}
          {ind && <div className="ibge">
            {ind.map((x) => (
              <div key={x.id}><small>{x.label}</small>
                <b>{x.unit === 'R$' ? `R$ ${fmtNum(x.valor, 0)}` : x.unit === '%' ? `${fmtNum(x.valor, 1)}%` : fmtNum(x.valor, x.unit === 'km²' || x.unit === 'sal. mín.' ? 1 : 0)}{x.unit !== 'R$' && x.unit !== '%' ? <em> {x.unit}</em> : ''}</b>
                <small className="muted">{x.ano}</small></div>))}
            {pop?.valor && area?.valor && <div><small>Densidade</small><b>{fmtNum(pop.valor / area.valor, 1)}<em> hab/km²</em></b><small className="muted">calculada</small></div>}
          </div>}
          <a className="src" href={`https://cidades.ibge.gov.br/brasil/${(tenant.uf || '').toLowerCase()}/${norm(tenant.name).replace(/\s+/g, '-')}/panorama`} target="_blank" rel="noreferrer">Fonte: IBGE Cidades <ExternalLink size={11} /></a>
        </div>
      </aside>

      {draft && (
        <Modal title="Novo prédio público" onClose={() => setDraft(null)}>
          <form onSubmit={savePlace} style={{ display: 'grid', gap: 10 }}>
            <label className="f">Nome<input className="input" required autoFocus placeholder="UBS Central" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label className="f">Tipo<select className="input" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value, secretaria: PLACE_KINDS[e.target.value][3] })}>
                {Object.entries(PLACE_KINDS).map(([k, [l, ic]]) => <option key={k} value={k}>{ic} {l}</option>)}</select></label>
              <label className="f">Secretaria (liga à frota)<input className="input" value={draft.secretaria} onChange={(e) => setDraft({ ...draft, secretaria: e.target.value })} /></label>
            </div>
            <small className="muted"><MapPin size={12} /> {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}</small>
            <button className="btn primary">Salvar no mapa</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Next24({ wx }) {
  const now = Date.now();
  const idx = wx.hourly.time.map((t, i) => [new Date(t).getTime(), i]).filter(([t]) => t >= now - 36e5).slice(0, 24).map(([, i]) => i);
  if (idx.length < 2) return null;
  const T = idx.map((i) => wx.hourly.temperature_2m[i]); const P = idx.map((i) => wx.hourly.precipitation_probability[i] || 0);
  const mn = Math.min(...T) - 1, mx = Math.max(...T) + 1, W = 280, H = 70;
  const x = (i) => (i / (idx.length - 1)) * W, y = (t) => H - 14 - ((t - mn) / (mx - mn)) * (H - 26);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="wx-chart" role="img" aria-label="Temperatura e chance de chuva nas próximas 24 horas">
      {P.map((p, i) => <rect key={i} x={x(i) - 4} y={H - 12 - (p / 100) * 30} width={8} height={(p / 100) * 30} rx={2} className="bar" />)}
      <polyline points={T.map((t, i) => `${x(i)},${y(t)}`).join(' ')} className="line" />
      {[0, 6, 12, 18, idx.length - 1].filter((i) => i < idx.length).map((i) => (
        <g key={i}><text x={Math.min(Math.max(x(i), 10), W - 10)} y={y(T[i]) - 5} textAnchor="middle">{Math.round(T[i])}°</text>
          <text x={Math.min(Math.max(x(i), 10), W - 10)} y={H - 1} textAnchor="middle" className="hr">{new Date(wx.hourly.time[idx[i]]).getHours()}h</text></g>))}
    </svg>
  );
}
