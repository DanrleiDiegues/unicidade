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
  [60045, 'Escolarização 6 a 14 anos', '%'],
  [60030, 'Esgotamento sanitário adequado', '%'],
  [60048, 'Receita vinda de transferências', '%'],
];

export function ibgeMalha(code) {
  return cached(`uc-ibge-malha-${code}`, 30 * 864e5, () => get(`${IBGE}/v3/malhas/municipios/${code}?formato=application/vnd.geo+json&qualidade=intermediaria`));
}

export function ibgeIndicadores(code) {
  return cached(`uc-ibge-ind-${code}`, 864e5, async () => {
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
