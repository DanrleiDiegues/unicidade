import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Brand } from '../ui';
import { api } from '../lib/api';
import { DEMO_PASSWORD } from '../lib/demo';

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', city: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(''); setInfo(''); setBusy(true);
    if (mode === 'forgot') {
      try { await api.resetPassword(f.email); setInfo('Enviamos um link para o seu e-mail. Abra-o para criar uma nova senha.'); }
      catch (x) { setErr(x.message); } finally { setBusy(false); }
      return;
    }
    try { onAuthed(mode === 'login' ? await api.signIn(f.email, f.password) : await api.signUp(f)); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  const quick = (email) => setF({ ...f, email, password: DEMO_PASSWORD });

  return (
    <div className="auth">
      <div className="auth-box glass">
        <div className="auth-side">
          <Brand />
          <div>
            <div className="eyebrow">Inteligência para a gestão municipal</div>
            <h1>Uma plataforma. Todas as secretarias.</h1>
            <p className="muted">Frotas, saúde, educação, infraestrutura e finanças num só lugar, com um único login para cada servidor.</p>
          </div>
          <div className="chips"><span className="badge">UNIfrotas</span><span className="badge">UNIsaúde</span><span className="badge">UNIeducação</span><span className="badge">UNInfra</span></div>
        </div>
        <form className="auth-form" method="post" action="#" onSubmit={submit}>
          <div className="tabs">
            <button type="button" className={`btn sm ${mode === 'login' ? 'primary' : ''}`} onClick={() => setMode('login')}>Entrar</button>
            <button type="button" className={`btn sm ${mode === 'signup' ? 'primary' : ''}`} onClick={() => setMode('signup')}>Criar conta grátis</button>
          </div>
          <h2 style={{ margin: 0 }}>{mode === 'login' ? 'Bem-vindo de volta' : mode === 'forgot' ? 'Recuperar senha' : 'Teste grátis, sem cartão'}</h2>
          {mode === 'forgot' && <p className="muted" style={{ margin: 0 }}>Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>}
          {mode === 'signup' && <label className="f">Nome<input className="input" required value={f.name} onChange={set('name')} /></label>}
          {mode === 'signup' && <label className="f">Sua cidade<input className="input" placeholder="Ex.: Bicas" value={f.city} onChange={set('city')} /></label>}
          <label className="f">E-mail<input className="input" type="email" name="email" autoComplete="username" required value={f.email} onChange={set('email')} /></label>
          {mode !== 'forgot' && <label className="f">Senha<input className="input" type="password" name="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={6} value={f.password} onChange={set('password')} /></label>}
          {err && <div style={{ color: 'var(--bad)', fontSize: 14 }}>{err}</div>}
          {info && <div style={{ color: 'var(--ok)', fontSize: 14 }}>{info}</div>}
          <button className="btn primary" disabled={busy}>{mode === 'login' ? 'Entrar' : mode === 'forgot' ? 'Enviar link' : 'Criar minha conta'}<ArrowRight size={16} /></button>
          {mode === 'login' && <button type="button" className="btn ghost sm" style={{ justifySelf: 'start', border: 0 }} onClick={() => { setMode('forgot'); setErr(''); }}>Esqueci minha senha</button>}
          {mode === 'forgot' && <button type="button" className="btn ghost sm" style={{ justifySelf: 'start', border: 0 }} onClick={() => { setMode('login'); setInfo(''); }}>Voltar para o login</button>}
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

export function SetPassword({ name, onDone }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr('');
    try { await api.setPassword(pw); onDone(); } catch (x) { setErr(x.message); }
  }
  return (
    <div className="auth">
      <form className="glass auth-form" style={{ width: 'min(440px, 100%)' }} onSubmit={submit}>
        <Brand />
        <h2 style={{ margin: 0 }}>Bem-vindo(a), {name?.split(' ')[0]}!</h2>
        <p className="muted" style={{ margin: 0 }}>Crie a sua senha para acessar o UNIcidade.</p>
        <label className="f">Nova senha<input className="input" type="password" name="new-password" autoComplete="new-password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {err && <div style={{ color: 'var(--bad)', fontSize: 14 }}>{err}</div>}
        <button className="btn primary">Salvar senha e entrar<ArrowRight size={16} /></button>
      </form>
    </div>
  );
}
