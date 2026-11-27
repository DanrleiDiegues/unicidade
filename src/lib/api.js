import { demo } from './demo';

// Sem as variáveis do Supabase, o app roda em modo demonstração (dados no navegador).
const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL);
export const api = hasSupabase ? (await import('./supa')).supa : demo;

// Cidade pelo endereço: chacara.unicidade.com.br  ou  unicidade.com.br/chacara
export function tenantSlugFromUrl() {
  const host = location.hostname.split('.');
  if (host.length > 3 && !['www', 'app'].includes(host[0])) return host[0];
  const seg = location.pathname.split('/').filter(Boolean)[0];
  return seg && !['admin', 'entrar'].includes(seg) ? seg : null;
}
