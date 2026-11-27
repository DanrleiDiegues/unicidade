import { useEffect, useState } from 'react';
import { LayoutGrid, Truck, Shield, Sun, CloudFog, LogOut, Map as MapIcon, Users, BadgeCheck } from 'lucide-react';
import { api } from './lib/api';
import { canSee, ROLES, isGeral } from './lib/catalog';
import { Backdrop, Brand, initials, Splash } from './ui';
import Auth, { SetPassword } from './pages/Auth';
import Hub from './pages/Hub';
import Mapa from './pages/Mapa';
import Cidadaos from './pages/Cidadaos';
import Funcionarios from './pages/Funcionarios';
import { SugestaoBotao } from './pages/Sugestoes';
import { TourBotao } from './pages/Tour';
import Frotas from './pages/Frotas';
import Motorista from './pages/Motorista';
import Admin from './pages/Admin';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [splash, setSplash] = useState(false);
  const [tenantId, setTenantId] = useState(null);
  const [view, setView] = useState('hub');
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('uc-theme') || 'white'; } catch { return 'white'; } });
  const [toast, setToast] = useState(null);
  const [allTenants, setAllTenants] = useState([]);

  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('uc-theme', theme); } catch { /* ignore */ } }, [theme]);
  useEffect(() => { api.session().then(enter); }, []);
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4200); };

  async function enter(s) {
    setSession(s);
    if (!s) return;
    if (s.welcomeSent) notify(`E-mail de boas-vindas enviado para ${s.user.email}.`);
    if (s.user.platform_admin) { setAllTenants(await api.tenants()); setView('admin'); return; }
    const m = s.memberships[0];
    setTenantId(m?.tenant_id || null);
    setView(m?.role === 'geral' ? 'hub' : (ROLES[m?.role]?.modules || [])[0] || 'hub');
  }

  if (session === undefined) return <Backdrop />;
  if (!session) return <><Backdrop /><Auth onAuthed={(s) => { setSplash(true); enter(s); }} /></>;
  if (api.needsPassword && !session.pwDone) return <><Backdrop /><SetPassword name={session.user.name} onDone={() => setSession({ ...session, pwDone: true })} /></>;

  const isAdmin = session.user.platform_admin;
  // O admin da plataforma enxerga qualquer cidade com o papel "geral".
  const memberships = isAdmin ? allTenants.map((t) => ({ tenant_id: t.id, tenant: t, role: 'geral' })) : session.memberships;
  const m = memberships.find((x) => x.tenant_id === tenantId);
  const role = m?.role;
  const openTenant = (id) => { setTenantId(id); setView('hub'); };

  return (
    <div className="shell">
      <Backdrop />
      <header className="topbar">
        <Brand />
        {m && (
          <div className="city glass" data-tour="city">
            {m.tenant.logo_url && <img src={m.tenant.logo_url} alt={`Brasão de ${m.tenant.name}`} />}
            <div><small>Prefeitura de</small><b>{m.tenant.name}</b></div>
          </div>
        )}
        <nav className="pill-nav glass">
          {m && isGeral(role) && <button data-tour="hub" className={view === 'hub' ? 'on' : ''} onClick={() => setView('hub')}><LayoutGrid size={15} />Visão geral</button>}
          {m && isGeral(role) && m.tenant.modules?.includes('mapa') && <button data-tour="mapa" className={view === 'mapa' ? 'on' : ''} onClick={() => setView('mapa')}><MapIcon size={15} />Mapa</button>}
          {m && isGeral(role) && <button data-tour="cidadaos" className={view === 'cidadaos' ? 'on' : ''} onClick={() => setView('cidadaos')}><Users size={15} />Cidadãos</button>}
          {m && isGeral(role) && <button data-tour="func" className={view === 'func' ? 'on' : ''} onClick={() => setView('func')}><BadgeCheck size={15} />Funcionários</button>}
          {m && canSee(role, 'frotas') && m.tenant.modules?.includes('frotas') && <button data-tour="frotas" className={view === 'frotas' ? 'on' : ''} onClick={() => setView('frotas')}><Truck size={15} />UNIfrotas</button>}
          {isAdmin && <button className={view === 'admin' ? 'on' : ''} onClick={async () => { setAllTenants(await api.tenants()); setView('admin'); }}><Shield size={15} />Admin</button>}
        </nav>
        {memberships.length > 1 && (
          <select className="input" style={{ width: 'auto' }} value={tenantId || ''} onChange={(e) => openTenant(e.target.value)}>
            <option value="" disabled>Escolher cidade</option>
            {memberships.map((x) => <option key={x.tenant_id} value={x.tenant_id}>{x.tenant.name}</option>)}
          </select>
        )}
        <SugestaoBotao session={session} tenant={m?.tenant} view={view} />
        <TourBotao userId={session.user.id} />
        <button className="btn sm" data-tour="tema" title="Alternar tema" onClick={() => setTheme(theme === 'white' ? 'grey' : 'white')}>
          {theme === 'white' ? <CloudFog size={16} /> : <Sun size={16} />}<span className="hide-sm">{theme === 'white' ? 'Grey' : 'White'}</span>
        </button>
        <div className="who glass">
          <div className="who-txt" style={{ textAlign: 'right' }}><div>{session.user.name}</div><small className="muted">{isAdmin ? 'Admin da plataforma' : ROLES[role]?.label || role}</small></div>
          <div className="avatar">{initials(session.user.name)}</div>
          <button className="btn ghost sm" title="Sair" onClick={async () => { await api.signOut(); setSession(null); setTenantId(null); }}><LogOut size={16} /></button>
        </div>
      </header>

      <main className="page">
        {view === 'admin' && isAdmin && <Admin notify={notify} onOpenTenant={openTenant} refresh={async () => setAllTenants(await api.tenants())} />}
        {view === 'hub' && m && isGeral(role) && <Hub tenant={m.tenant} user={session.user} onOpen={(k) => k === 'frotas' || k === 'mapa' ? setView(k) : notify('Módulo em construção — em breve.')} />}
        {view === 'func' && m && isGeral(role) && <Funcionarios tenant={m.tenant} notify={notify} />}
        {view === 'cidadaos' && m && isGeral(role) && <Cidadaos tenant={m.tenant} user={session.user} notify={notify} />}
        {view === 'mapa' && m && isGeral(role) && <Mapa tenant={m.tenant} role={role} notify={notify} onOpenFrotas={() => setView('frotas')} />}
        {view === 'frotas' && m && (role === 'motorista'
          ? <Motorista tenant={m.tenant} user={session.user} notify={notify} />
          : <Frotas tenant={m.tenant} user={session.user} notify={notify} />)}
        {m && !isGeral(role) && view !== 'frotas' && <div className="glass card">O módulo de {ROLES[role]?.label || role} está em construção. Em breve ele aparece aqui.</div>}
        {!m && view !== 'admin' && <div className="glass card">Seu usuário ainda não está vinculado a nenhuma cidade.</div>}
      </main>
      {toast && <div className="toast glass">{toast}</div>}
      {splash && <Splash tenant={isAdmin ? null : session.memberships[0]?.tenant} onDone={() => setSplash(false)} />}
    </div>
  );
}
