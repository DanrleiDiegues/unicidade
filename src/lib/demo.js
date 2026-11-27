// Adaptador de DEMONSTRAÇÃO: guarda tudo no navegador (localStorage).
// Tem as mesmas funções do adaptador Supabase (supa.js), então as telas não mudam.
import { STAGES } from './catalog';

const KEY = 'unicidade-demo-v7';
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 864e5).toISOString();
export const DEMO_PASSWORD = 'unicidade';

const tasksFor = (stage) =>
  STAGES.flatMap((s, i) => s.tasks.map((label) => ({ id: uid(), stage: i, label, done: i < stage || stage === 5 })));

function seedFleet(db, tenant_id, driverId) {
  const cars = [
    ['RTQ-4F21', 'Fiat Strada 1.3', 'Outro', 'Obras', 48210],
    ['QMZ-8B10', 'VW Virtus', 'Carro do gabinete', 'Gabinete', 91540],
    ['SAB-2C77', 'Mercedes Sprinter', 'Ambulância', 'Saúde', 133800],
    ['RTA-0E55', 'Iveco Ônibus Escolar', 'Ônibus', 'Educação', 210330],
    ['PYX-6D43', 'Renault Master', 'Van', 'Saúde', 76020],
    ['QOP-9A12', 'Caminhão Basculante VW', 'Caminhão', 'Obras', 158700],
  ].map(([plate, model, type, secretaria, km], i) => ({
    id: uid(), tenant_id, plate, model, type, secretaria, km, year: 2016 + (i % 8), status: 'disponivel',
  }));
  db.vehicles.push(...cars);
  const orders = [
    [2, 'Barulho na suspensão dianteira', 'alta', 3, 2],
    [3, 'Freio traseiro baixo', 'alta', 1, 5],
    [0, 'Troca de óleo e filtros (10 mil km)', 'baixa', 5, 9],
    [5, 'Pneu dianteiro furado', 'media', 0, 0],
    [1, 'Ar-condicionado não gela', 'baixa', 2, 4],
    [4, 'Revisão do sistema elétrico', 'media', 5, 14],
  ];
  orders.forEach(([v, title, priority, stage, d]) => {
    const car = cars[v];
    const closed = stage === 5;
    if (!closed) car.status = 'manutencao';
    db.orders.push({
      id: uid(), tenant_id, vehicle_id: car.id, title, description: '', priority, stage, closed, type: 'Corretiva', oficina: '', value: 0,
      tasks: tasksFor(stage), created_by: driverId, created_at: daysAgo(d), lat: [-21.655, -21.690, null, -21.700, -21.664, null][v] ?? null, lng: [-43.248, -43.205, null, -43.262, -43.190, null][v] ?? null,
      history: [{ at: daysAgo(d), text: 'Ocorrência registrada' }],
    });
  });
  db.moves.push({ id: uid(), tenant_id, vehicle_id: cars[0].id, setor: 'Obras', finalidade: 'Visita às obras da praça', driver: 'José Motorista', km_out: 48100, km_in: 48210, out_at: daysAgo(2), in_at: daysAgo(2) });
  for (let m = 0; m < 6; m++)
    cars.forEach((c, i) =>
      db.fuel.push({ id: uid(), tenant_id, vehicle_id: c.id, liters: 40 + ((i * 7 + m * 13) % 60),
        value: 0, date: daysAgo(m * 30 + i) }));
  db.fuel.forEach((f) => (f.value = f.value || Math.round(f.liters * 6.1)));
}

function seedCitizens(db, tenant_id) {
  const P = [
    ['Maria Aparecida Souza (exemplo)', '1951-03-14', 'Centro', ['Idoso', 'Programa social'], [['saude', 'Consulta de rotina na UBS', 6], ['transporte', 'Transporte para exame em Juiz de Fora', 20], ['social', 'Visita domiciliar do CRAS', 45]]],
    ['João Pedro Lima (exemplo)', '2014-08-02', 'Recanto das Cachoeiras', ['Criança', 'Estudante'], [['educacao', 'Matrícula no 6º ano', 290], ['transporte', 'Inscrito no transporte escolar', 280], ['saude', 'Vacinação em dia', 60]]],
    ['Ana Clara Ribeiro (exemplo)', '1993-11-21', 'Zona rural', ['Gestante', 'Zona rural'], [['saude', 'Pré-natal · 3ª consulta', 3], ['ouvidoria', 'Pedido de melhoria na estrada vicinal', 15], ['tributos', 'Emissão de guia de ITR', 120]]],
  ];
  P.forEach(([nome, nascimento, bairro, tags, ev], i) => {
    const c = { id: uid(), tenant_id, nome, nascimento, bairro, tags, cpf: `000${i + 1}23456789`.slice(0, 11), telefone: '(32) 9 0000-000' + i, email: '', endereco: '', notas: 'Cadastro fictício para demonstração.', created_at: now() };
    db.citizens.push(c);
    ev.forEach(([area, titulo, d]) => db.cevents.push({ id: uid(), tenant_id, citizen_id: c.id, area, titulo, data: daysAgo(d).slice(0, 10), detalhe: '', por: 'Equipe (exemplo)' }));
  });
}

function seed() {
  const db = { users: [], tenants: [], members: [], vehicles: [], orders: [], fuel: [], outbox: [], moves: [], suppliers: [], places: [], citizens: [], cevents: [], caccess: [] };
  const admin = { id: uid(), name: 'Danrlei Diegues', email: 'danrlei.diegueso@gmail.com', platform_admin: true, welcomed: true };
  const gestor = { id: uid(), name: 'Danrlei Oliveira', email: 'danrlei.oliveira@estudante.ufjf.br', welcomed: false };
  const motorista = { id: uid(), name: 'José Motorista', email: 'motorista@chacara.demo', welcomed: false };
  const helton = { id: uid(), name: 'Helton Diegues', email: 'heltondiegues@gmail.com', password: 'heltonchacara', welcomed: false };
  db.users.push(admin, gestor, motorista, helton);
  const chacara = { id: uid(), slug: 'chacara', name: 'Chácara', uf: 'MG', logo_url: './logos/chacara.png', ibge: '3115904', lat: -21.6728, lng: -43.2207, plan: 'free', modules: ['frotas'], created_at: now() };
  db.tenants.push(chacara);
  db.members.push({ user_id: helton.id, tenant_id: chacara.id, role: 'geral' }, { user_id: gestor.id, tenant_id: chacara.id, role: 'geral' }, { user_id: motorista.id, tenant_id: chacara.id, role: 'motorista' });
  seedFleet(db, chacara.id, motorista.id);
  [['Prefeitura Municipal (exemplo)', 'prefeitura', 'Gabinete', -21.6731, -43.2216], ['UBS Central (exemplo)', 'saude', 'Saúde', -21.6712, -43.2242],
    ['Escola Municipal (exemplo)', 'educacao', 'Educação', -21.6748, -43.2250], ['Garagem da frota (exemplo)', 'garagem', '', -21.6766, -43.2172],
    ['Pátio de obras (exemplo)', 'obras', 'Obras', -21.6790, -43.2195]]
    .forEach(([name, kind, secretaria, lat, lng]) => db.places.push({ id: uid(), tenant_id: chacara.id, name, kind, secretaria, lat, lng }));
  seedCitizens(db, chacara.id);
  [['Auto Elétrica Chácara (exemplo)', 'Auto elétrica'], ['Mecânica Diesel São João (exemplo)', 'Oficina mecânica'], ['Concessionária VW Juiz de Fora (exemplo)', 'Concessionária']]
    .forEach(([name, kind]) => db.suppliers.push({ id: uid(), tenant_id: chacara.id, name, kind, doc: '', phone: '' }));
  return db;
}

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { return seed(); } };
let db = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sem storage */ } };
let current = null;
try { current = sessionStorage.getItem(KEY + '-me'); } catch { /* ignore */ }

function welcome(user, tenantName) {
  db.outbox.unshift({
    id: uid(), at: now(), to: user.email,
    subject: `Bem-vindo(a) ao UNIcidade${tenantName ? ' — ' + tenantName : ''}`,
    body: `Olá, ${user.name}! Sua conta no UNIcidade está pronta. Acesse a plataforma e conheça os módulos da sua cidade.`,
  });
}

function sessionOf(id) {
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  const memberships = db.members.filter((m) => m.user_id === id)
    .map((m) => ({ ...m, tenant: db.tenants.find((t) => t.id === m.tenant_id) }));
  return { user, memberships };
}

export const demo = {
  mode: 'demo',
  needsPassword: false,
  async setPassword() {},
  async resetPassword() {},
  async session() { return current ? sessionOf(current) : null; },
  async signIn(email, password) {
    const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || password !== (u.password || DEMO_PASSWORD)) throw new Error('E-mail ou senha inválidos.');
    let sent = false;
    if (!u.welcomed) { welcome(u); u.welcomed = true; sent = true; save(); }
    current = u.id; try { sessionStorage.setItem(KEY + '-me', u.id); } catch { /* ignore */ }
    return { ...sessionOf(u.id), welcomeSent: sent };
  },
  async signOut() { current = null; try { sessionStorage.removeItem(KEY + '-me'); } catch { /* ignore */ } },
  async signUp({ name, email, city }) {
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Este e-mail já tem conta.');
    const u = { id: uid(), name, email, welcomed: true };
    const t = { id: uid(), slug: uid(), name: `${city || 'Minha cidade'} (teste)`, uf: 'MG', plan: 'trial', modules: ['frotas'], created_at: now() };
    db.users.push(u); db.tenants.push(t); db.members.push({ user_id: u.id, tenant_id: t.id, role: 'geral' });
    seedFleet(db, t.id, u.id); welcome(u, t.name); save();
    current = u.id; try { sessionStorage.setItem(KEY + '-me', u.id); } catch { /* ignore */ }
    return { ...sessionOf(u.id), welcomeSent: true };
  },
  // Administração da plataforma
  async tenants() { return db.tenants.map((t) => ({ ...t, users: db.members.filter((m) => m.tenant_id === t.id).length })); },
  async createTenant({ name, slug, uf, modules }) {
    if (db.tenants.some((t) => t.slug === slug)) throw new Error('Já existe uma cidade com esse endereço.');
    const t = { id: uid(), name, slug, uf, plan: 'free', modules, created_at: now() }; db.tenants.push(t); save(); return t;
  },
  async updateTenant(id, patch) { Object.assign(db.tenants.find((t) => t.id === id), patch); save(); },
  async members(tenant_id) {
    return db.members.filter((m) => !tenant_id || m.tenant_id === tenant_id)
      .map((m) => ({ ...m, user: db.users.find((u) => u.id === m.user_id), tenant: db.tenants.find((t) => t.id === m.tenant_id) }));
  },
  async invite({ name, email, tenant_id, role }) {
    let u = db.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) { u = { id: uid(), name, email, welcomed: true }; db.users.push(u); }
    if (db.members.some((m) => m.user_id === u.id && m.tenant_id === tenant_id)) throw new Error('Usuário já está nessa cidade.');
    db.members.push({ user_id: u.id, tenant_id, role });
    welcome(u, db.tenants.find((t) => t.id === tenant_id)?.name); save();
  },
  async outbox() { return db.outbox; },
  // UNIfrotas
  async vehicles(tenant_id) { return db.vehicles.filter((v) => v.tenant_id === tenant_id); },
  async addVehicle(v) { const x = { id: uid(), status: 'disponivel', ...v }; db.vehicles.push(x); save(); return x; },
  async orders(tenant_id, onlyUser) {
    return db.orders.filter((o) => o.tenant_id === tenant_id && (!onlyUser || o.created_by === onlyUser))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async createOrder({ tenant_id, vehicle_id, title, description, priority, km, by, type = 'Corretiva', forms = {}, lat = null, lng = null }) {
    const o = { id: uid(), tenant_id, vehicle_id, title, description, priority, type, forms, lat, lng, oficina: '', value: 0, closed: false, stage: 0, tasks: tasksFor(0),
      created_by: by, created_at: now(), history: [{ at: now(), text: `Ocorrência registrada${km ? ` (km ${km})` : ''}` }] };
    db.orders.push(o);
    const v = db.vehicles.find((x) => x.id === vehicle_id); if (v) { v.status = 'manutencao'; if (km) v.km = Number(km); }
    save(); return o;
  },
  async updateOrder(id, patch, note) {
    const o = db.orders.find((x) => x.id === id); Object.assign(o, patch);
    if (note) o.history.push({ at: now(), text: note });
    const v = db.vehicles.find((x) => x.id === o.vehicle_id);
    if (v) v.status = db.orders.some((x) => x.vehicle_id === v.id && !x.closed) ? 'manutencao' : 'disponivel';
    save(); return o;
  },
  // Movimentações (saída e devolução de veículos)
  async moves(tenant_id) { return db.moves.filter((m) => m.tenant_id === tenant_id).sort((a, b) => b.out_at.localeCompare(a.out_at)); },
  async checkout(m) {
    db.moves.push({ id: uid(), ...m, km_out: Number(m.km_out), out_at: now(), in_at: null, km_in: null });
    const v = db.vehicles.find((x) => x.id === m.vehicle_id); if (v) v.status = 'em_uso';
    save();
  },
  async checkin(id, km_in) {
    const m = db.moves.find((x) => x.id === id); Object.assign(m, { km_in: Number(km_in), in_at: now() });
    const v = db.vehicles.find((x) => x.id === m.vehicle_id); if (v) { v.status = 'disponivel'; v.km = Math.max(v.km, Number(km_in)); }
    save();
  },
  async citizens(tenant_id) { return (db.citizens || []).filter((x) => x.tenant_id === tenant_id).sort((a, b) => a.nome.localeCompare(b.nome)); },
  async addCitizen(x) { const c = { id: uid(), created_at: now(), ...x }; (db.citizens ||= []).push(c); save(); return c; },
  async citizenEvents(citizen_id) { return (db.cevents || []).filter((x) => x.citizen_id === citizen_id).sort((a, b) => b.data.localeCompare(a.data)); },
  async addCitizenEvent(x) { const e = { id: uid(), ...x }; (db.cevents ||= []).push(e); save(); return e; },
  async logCitizenAccess(x) { (db.caccess ||= []).push({ id: uid(), at: now(), ...x }); save(); },
  async citizenAccess(citizen_id) { return (db.caccess || []).filter((x) => x.citizen_id === citizen_id).sort((a, b) => b.at.localeCompare(a.at)); },
  async places(tenant_id) { return (db.places || []).filter((x) => x.tenant_id === tenant_id); },
  async addPlace(x) { const p = { id: uid(), ...x }; (db.places ||= []).push(p); save(); return p; },
  async updatePlace(id, patch) { Object.assign(db.places.find((x) => x.id === id), patch); save(); },
  async suppliers(tenant_id) { return (db.suppliers || []).filter((x) => x.tenant_id === tenant_id).sort((a, b) => a.name.localeCompare(b.name)); },
  async addSupplier(x) { const s = { id: uid(), ...x }; (db.suppliers ||= []).push(s); save(); return s; },
  async fuel(tenant_id) { return db.fuel.filter((f) => f.tenant_id === tenant_id); },
  async reset() { db = seed(); save(); },
};
