import { useEffect, useState } from 'react';
import { LayoutGrid, Truck, Shield, Sun, CloudFog, LogOut, Map as MapIcon } from 'lucide-react';
import { api } from './lib/api';
import { canSee } from './lib/catalog';
import { Backdrop, Brand, initials } from './ui';
import Auth, { SetPassword } from './pages/Auth';
import Hub from './pages/Hub';
import Mapa from './pages/Mapa';
import Frotas from './pages/Frotas';
import Motorista from './pages/Motorista';
import Admin from './pages/Admin';

export default function App() {
  const [session, setSession] = useState(undefined);
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
    setView(m?.role === 'motorista' ? 'frotas' : 'hub');
  }

  if (session === undefined) return <Backdrop />;
  if (!session) return <><Backdrop /><Auth onAuthed={enter} /></>;
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
          <div className="city glass">
            {m.tenant.logo_url && <img src={m.tenant.logo_url} alt={`Brasão de ${m.tenant.name}`} />}
            <div><small>Prefeitura de</small><b>{m.tenant.name}</b></div>
          </div>
        )}
        <nav className="pill-nav glass">
          {m && role !== 'motorista' && <button className={view === 'hub' ? 'on' : ''} onClick={() => setView('hub')}><LayoutGrid size={15} />Visão geral</button>}
          {m && role !== 'motorista' && <button className={view === 'mapa' ? 'on' : ''} onClick={() => setView('mapa')}><MapIcon size={15} />Mapa</button>}
          {m && canSee(role, 'frotas') && m.tenant.modules?.includes('frotas') && <button className={view === 'frotas' ? 'on' : ''} onClick={() => setView('frotas')}><Truck size={15} />UNIfrotas</button>}
          {isAdmin && <button className={view === 'admin' ? 'on' : ''} onClick={async () => { setAllTenants(await api.tenants()); setView('admin'); }}><Shield size={15} />Admin</button>}
        </nav>
        {memberships.length > 1 && (
          <select className="input" style={{ width: 'auto' }} value={tenantId || ''} onChange={(e) => openTenant(e.target.value)}>
            <option value="" disabled>Escolher cidade</option>
            {memberships.map((x) => <option key={x.tenant_id} value={x.tenant_id}>{x.tenant.name}</option>)}
          </select>
        )}
        <button className="btn sm" title="Alternar tema" onClick={() => setTheme(theme === 'white' ? 'grey' : 'white')}>
          {theme === 'white' ? <CloudFog size={16} /> : <Sun size={16} />}{theme === 'white' ? 'Grey' : 'White'}
        </button>
        <div className="who glass">
          <div style={{ textAlign: 'right' }}><div>{session.user.name}</div><small className="muted">{isAdmin ? 'Admin da plataforma' : role === 'motorista' ? 'Motorista' : 'Gestão geral'}</small></div>
          <div className="avatar">{initials(session.user.name)}</div>
          <button className="btn ghost sm" title="Sair" onClick={async () => { await api.signOut(); setSession(null); setTenantId(null); }}><LogOut size={16} /></button>
        </div>
      </header>

      <main className="page">
        {view === 'admin' && isAdmin && <Admin notify={notify} onOpenTenant={openTenant} refresh={async () => setAllTenants(await api.tenants())} />}
        {view === 'hub' && m && <Hub tenant={m.tenant} user={session.user} onOpen={(k) => k === 'frotas' || k === 'mapa' ? setView(k) : notify('Módulo em construção — em breve.')} />}
        {view === 'mapa' && m && <Mapa tenant={m.tenant} role={role} notify={notify} onOpenFrotas={() => setView('frotas')} />}
        {view === 'frotas' && m && (role === 'motorista'
          ? <Motorista tenant={m.tenant} user={session.user} notify={notify} />
          : <Frotas tenant={m.tenant} user={session.user} notify={notify} />)}
        {!m && view !== 'admin' && <div className="glass card">Seu usuário ainda não está vinculado a nenhuma cidade.</div>}
      </main>
      {toast && <div className="toast glass">{toast}</div>}
    </div>
  );
}
