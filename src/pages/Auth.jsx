import { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { DEMO_PASSWORD } from '../lib/demo';

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', city: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { onAuthed(mode === 'login' ? await api.signIn(f.email, f.password) : await api.signUp(f)); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  const quick = (email) => setF({ ...f, email, password: DEMO_PASSWORD });

  return (
    <div className="auth">
      <div className="auth-box glass">
        <div className="auth-side">
          <div className="brand"><div className="logo"><Building2 size={18} /></div><span><b>UNI</b>cidade</span></div>
          <div>
            <div className="eyebrow">Inteligência para a gestão municipal</div>
            <h1>Uma plataforma. Todas as secretarias.</h1>
            <p className="muted">Frotas, saúde, educação, infraestrutura e finanças num só lugar, com um único login para cada servidor.</p>
          </div>
          <div className="chips"><span className="badge">UNIfrotas</span><span className="badge">UNIsaúde</span><span className="badge">UNIeducação</span><span className="badge">UNInfra</span></div>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div className="tabs">
            <button type="button" className={`btn sm ${mode === 'login' ? 'primary' : ''}`} onClick={() => setMode('login')}>Entrar</button>
            <button type="button" className={`btn sm ${mode === 'signup' ? 'primary' : ''}`} onClick={() => setMode('signup')}>Criar conta grátis</button>
          </div>
          <h2 style={{ margin: 0 }}>{mode === 'login' ? 'Bem-vindo de volta' : 'Teste grátis, sem cartão'}</h2>
          {mode === 'signup' && <label className="f">Nome<input className="input" required value={f.name} onChange={set('name')} /></label>}
          {mode === 'signup' && <label className="f">Sua cidade<input className="input" placeholder="Ex.: Bicas" value={f.city} onChange={set('city')} /></label>}
          <label className="f">E-mail<input className="input" type="email" required value={f.email} onChange={set('email')} /></label>
          <label className="f">Senha<input className="input" type="password" required minLength={6} value={f.password} onChange={set('password')} /></label>
          {err && <div style={{ color: 'var(--bad)', fontSize: 14 }}>{err}</div>}
          <button className="btn primary" disabled={busy}>{mode === 'login' ? 'Entrar' : 'Criar minha conta'}<ArrowRight size={16} /></button>
          {api.mode === 'demo' && mode === 'login' && (
            <div className="demo-hint">
              Modo demonstração (senha: <b>{DEMO_PASSWORD}</b>). Entrar como:
              <div className="chips" style={{ marginTop: 8 }}>
                <button type="button" className="btn sm" onClick={() => quick('danrlei.oliveira@estudante.ufjf.br')}>Gestor de Chácara</button>
                <button type="button" className="btn sm" onClick={() => quick('motorista@chacara.demo')}>Motorista</button>
                <button type="button" className="btn sm" onClick={() => quick('danrlei.diegueso@gmail.com')}>Admin</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
