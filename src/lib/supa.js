// Adaptador de PRODUÇÃO (Supabase). Mesmas funções do demo.js.
// A segurança real fica no banco (Row Level Security em supabase/schema.sql):
// mesmo que alguém altere o front-end, só enxerga os dados da própria cidade.
import { createClient } from '@supabase/supabase-js';
import { STAGES } from './catalog';

// Link de convite ou de recuperação: a pessoa entra logada e precisa definir a senha.
const needsPassword = /type=(invite|recovery)/.test(location.hash);
const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
// Mensagens do Supabase em português
const PT = [
  [/rate limit/i, 'Muitos e-mails enviados agora. Aguarde alguns minutos e tente de novo.'],
  [/invalid login credentials/i, 'E-mail ou senha inválidos.'],
  [/already registered|already been registered/i, 'Este e-mail já tem conta. Use a aba Entrar ou "Esqueci minha senha".'],
  [/email not confirmed/i, 'Confirme seu e-mail pelo link que enviamos antes de entrar.'],
  [/password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres.'],
];
const pt = (m) => (PT.find(([r]) => r.test(m)) || [null, m])[1];
const ok = ({ data, error }) => { if (error) throw new Error(pt(error.message)); return data; };
const tasks0 = () => STAGES.flatMap((s, i) => s.tasks.map((label) => ({ id: crypto.randomUUID(), stage: i, label, done: false })));
const fn = (name, body) => sb.functions.invoke(name, { body }).then(ok);
// E-mails personalizados são opcionais: se a função ainda não existir, o login segue normalmente.
const tryFn = (name, body) => fn(name, body).then(() => true).catch(() => false);

async function loadSession() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const profile = ok(await sb.from('profiles').select('*').eq('id', user.id).single());
  const memberships = ok(await sb.from('members').select('*, tenant:tenants(*)').eq('user_id', user.id));
  return { user: profile, memberships };
}

export const supa = {
  mode: 'prod',
  needsPassword,
  async setPassword(password) { ok(await sb.auth.updateUser({ password })); history.replaceState(null, '', location.pathname); },
  session: loadSession,
  async signIn(email, password) {
    ok(await sb.auth.signInWithPassword({ email, password }));
    const s = await loadSession();
    let welcomeSent = false;
    if (!s.user.welcomed) welcomeSent = await tryFn('welcome', {}); // marca welcomed no servidor
    return { ...s, welcomeSent };
  },
  async signOut() { await sb.auth.signOut(); },
  async resetPassword(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin })); },
  async signUp({ name, email, password, city }) {
    const { session } = ok(await sb.auth.signUp({ email, password, options: { data: { name } } }));
    if (!session) throw new Error('Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.');
    ok(await sb.rpc('create_trial_city', { city_name: city || 'Minha cidade' }));
    return { ...(await loadSession()), welcomeSent: await tryFn('welcome', {}) };
  },
  async tenants() { return ok(await sb.from('tenants').select('*, users:members(count)')).map((t) => ({ ...t, users: t.users?.[0]?.count || 0 })); },
  async createTenant(t) { return ok(await sb.from('tenants').insert(t).select().single()); },
  async updateTenant(id, patch) { ok(await sb.from('tenants').update(patch).eq('id', id)); },
  async members(tenant_id) {
    let q = sb.from('members').select('*, user:profiles(*), tenant:tenants(*)');
    if (tenant_id) q = q.eq('tenant_id', tenant_id);
    return ok(await q);
  },
  async invite(p) { return fn('invite', p); }, // cria o usuário, vincula à cidade e manda o e-mail
  async outbox() { return ok(await sb.from('outbox').select('*').order('at', { ascending: false }).limit(50)); },
  async vehicles(tenant_id) { return ok(await sb.from('vehicles').select('*').eq('tenant_id', tenant_id).order('plate')); },
  async addVehicle(v) { return ok(await sb.from('vehicles').insert(v).select().single()); },
  async orders(tenant_id, onlyUser) {
    let q = sb.from('orders').select('*').eq('tenant_id', tenant_id).order('created_at', { ascending: false });
    if (onlyUser) q = q.eq('created_by', onlyUser);
    return ok(await q);
  },
  async createOrder({ tenant_id, vehicle_id, title, description, priority, km, by, type = 'Corretiva', forms = {}, lat = null, lng = null }) {
    const o = ok(await sb.from('orders').insert({ tenant_id, vehicle_id, title, description, priority, type, forms, lat, lng, stage: 0,
      tasks: tasks0(), created_by: by, history: [{ at: new Date().toISOString(), text: `Ocorrência registrada${km ? ` (km ${km})` : ''}` }] }).select().single());
    await sb.from('vehicles').update({ status: 'manutencao', ...(km ? { km: Number(km) } : {}) }).eq('id', vehicle_id);
    return o;
  },
  async updateOrder(id, patch, note) {
    if (note) {
      const cur = ok(await sb.from('orders').select('history').eq('id', id).single());
      patch.history = [...(cur.history || []), { at: new Date().toISOString(), text: note }];
    }
    return ok(await sb.from('orders').update(patch).eq('id', id).select().single());
  },
  async moves(tenant_id) { return ok(await sb.from('moves').select('*').eq('tenant_id', tenant_id).order('out_at', { ascending: false })); },
  async checkout(m) {
    ok(await sb.from('moves').insert({ ...m, km_out: Number(m.km_out) }));
    await sb.from('vehicles').update({ status: 'em_uso' }).eq('id', m.vehicle_id);
  },
  async checkin(id, km_in) {
    const m = ok(await sb.from('moves').update({ km_in: Number(km_in), in_at: new Date().toISOString() }).eq('id', id).select().single());
    await sb.from('vehicles').update({ status: 'disponivel', km: Number(km_in) }).eq('id', m.vehicle_id);
  },
  async citizens(tenant_id) { return ok(await sb.from('citizens').select('*').eq('tenant_id', tenant_id).order('nome')); },
  async addCitizen(x) { return ok(await sb.from('citizens').insert(x).select().single()); },
  async citizenEvents(citizen_id) { return ok(await sb.from('citizen_events').select('*').eq('citizen_id', citizen_id).order('data', { ascending: false })); },
  async addCitizenEvent(x) { return ok(await sb.from('citizen_events').insert(x).select().single()); },
  async logCitizenAccess(x) { await sb.from('citizen_access').insert(x); },
  async citizenAccess(citizen_id) { return ok(await sb.from('citizen_access').select('*').eq('citizen_id', citizen_id).order('at', { ascending: false }).limit(20)); },
  async places(tenant_id) { return ok(await sb.from('places').select('*').eq('tenant_id', tenant_id)); },
  async addPlace(x) { return ok(await sb.from('places').insert(x).select().single()); },
  async updatePlace(id, patch) { ok(await sb.from('places').update(patch).eq('id', id)); },
  async suppliers(tenant_id) { return ok(await sb.from('suppliers').select('*').eq('tenant_id', tenant_id).order('name')); },
  async addSupplier(x) { return ok(await sb.from('suppliers').insert(x).select().single()); },
  async fuel(tenant_id) { return ok(await sb.from('fuel').select('*').eq('tenant_id', tenant_id)); },
  async reset() {},
};
