// Dados abertos da cidade: IBGE (malha + indicadores) e clima (Open-Meteo). Sem chave, com cache local.
const IBGE = 'https://servicodados.ibge.gov.br/api';

function cached(key, ttlMs, fn) {
  try {
    const c = JSON.parse(localStorage.getItem(key) || 'null');
    if (c && Date.now() - c.t < ttlMs) return Promise.resolve(c.v);
  } catch { /* ignore */ }
  return fn().then((v) => { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch { /* ignore */ } return v; });
}
const get = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });

export const IBGE_IND = [
  [29171, 'População estimada', 'hab.'],
  [96385, 'População no Censo', 'hab.'],
  [29167, 'Área do município', 'km²'],
  [47001, 'PIB per capita', 'R$'],
  [29765, 'Salário médio formal', 'sal. mín.'],
  [60045, 'Escolarização 6–14 anos', '%'],
  [60030, 'Esgoto adequado', '%'],
  [60048, 'Receita de repasses', '%'],
];

export function ibgeMalha(code) {
  return cached(`uc-ibge-malha-${code}`, 30 * 864e5, () => get(`${IBGE}/v3/malhas/municipios/${code}?formato=application/vnd.geo+json&qualidade=intermediaria`));
}

export function ibgeIndicadores(code) {
  return cached(`uc-ibge-ind2-${code}`, 864e5, async () => {
    const r = await get(`${IBGE}/v1/pesquisas/indicadores/${IBGE_IND.map((x) => x[0]).join('|')}/resultados/${code}`);
    return IBGE_IND.map(([id, label, unit]) => {
      const serie = r.find((x) => x.id === id)?.res?.[0]?.res || {};
      const anos = Object.keys(serie).filter((a) => serie[a] && !isNaN(Number(serie[a]))).sort();
      const ano = anos[anos.length - 1];
      return { id, label, unit, ano, valor: ano ? Number(serie[ano]) : null };
    });
  });
}

export function clima(lat, lng) {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=America%2FSao_Paulo&forecast_days=5`
    + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,is_day'
    + '&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum';
  return cached(`uc-clima-${lat}-${lng}`, 15 * 6e4, () => get(u));
}

// Códigos WMO → texto e ícone
export function tempo(code, day = 1) {
  const t = [
    [[0], 'Céu limpo', day ? '☀️' : '🌙'], [[1], 'Poucas nuvens', day ? '🌤️' : '🌙'], [[2], 'Parcialmente nublado', '⛅'], [[3], 'Nublado', '☁️'],
    [[45, 48], 'Neblina', '🌫️'], [[51, 53, 55, 56, 57], 'Garoa', '🌦️'], [[61, 63, 66, 80, 81], 'Chuva', '🌧️'], [[65, 67, 82], 'Chuva forte', '🌧️'],
    [[71, 73, 75, 77, 85, 86], 'Neve', '❄️'], [[95, 96, 99], 'Tempestade', '⛈️'],
  ].find(([c]) => c.includes(code));
  return t ? { txt: t[1], ico: t[2] } : { txt: '—', ico: '🌡️' };
}

export const fmtNum = (v, d = 0) => (v == null ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d }));

export const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
const nrm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Municípios de uma UF (para autocompletar)
export function ibgeMunicipios(uf) {
  return cached(`uc-ibge-mun-${uf}`, 30 * 864e5, () => get(`${IBGE}/v1/localidades/estados/${uf}/municipios`).then((r) => r.map((m) => ({ id: String(m.id), nome: m.nome }))));
}

// Acha o código IBGE e o centro (sede) da cidade pelo nome + UF.
export async function localizarCidade(nome, uf) {
  const lista = await ibgeMunicipios(uf);
  const m = lista.find((x) => nrm(x.nome) === nrm(nome));
  if (!m) throw new Error(`Não achei "${nome}" entre os municípios de ${uf} no IBGE.`);
  let lat = null, lng = null, fonte = '';
  try { // sede do município pelo OpenStreetMap
    const r = await get(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=br&q=${encodeURIComponent(`${m.nome}, ${uf}, Brasil`)}`);
    const same = r.filter((x) => nrm(x.name) === nrm(m.nome));
    const best = same.find((x) => ['city', 'town', 'village'].includes(x.type)) || same.find((x) => ['municipality', 'administrative'].includes(x.type)) || r[0];
    if (best) { lat = +(+best.lat).toFixed(4); lng = +(+best.lon).toFixed(4); fonte = 'OpenStreetMap'; }
  } catch { /* segue para o IBGE */ }
  if (lat == null) { // centro do polígono do IBGE
    const g = (await ibgeMalha(m.id)).features?.[0]?.geometry;
    const pts = (g?.type === 'Polygon' ? g.coordinates[0] : g?.coordinates?.[0]?.[0]) || [];
    if (pts.length) { lng = +(pts.reduce((s, p) => s + p[0], 0) / pts.length).toFixed(4); lat = +(pts.reduce((s, p) => s + p[1], 0) / pts.length).toFixed(4); fonte = 'IBGE (centro do território)'; }
  }
  return { ibge: m.id, nome: m.nome, lat, lng, fonte };
}

// Reduz a imagem do brasão (máx. 256 px, PNG) e devolve como data URL
export function brasaoDataUrl(file, max = 256) {
  return new Promise((ok, fail) => {
    if (!/^image\//.test(file.type)) return fail(new Error('Envie uma imagem (PNG, JPG ou SVG).'));
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width || max, img.height || max));
      const c = document.createElement('canvas'); c.width = Math.round((img.width || max) * k); c.height = Math.round((img.height || max) * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/png'));
    };
    img.onerror = () => fail(new Error('Não consegui ler essa imagem.'));
    img.src = url;
  });
}
