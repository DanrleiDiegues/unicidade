// Envia o e-mail de boas-vindas (cadastro e primeiro login) via Resend.
// Deploy: supabase functions deploy welcome ; segredo: supabase secrets set RESEND_API_KEY=...
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

export async function sendWelcome(email: string, name: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'UNIcidade <boasvindas@unicidade.com.br>', to: email,
      subject: 'Bem-vindo(a) ao UNIcidade',
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px">
        <h2>Olá, ${name}!</h2>
        <p>Sua conta no <b>UNIcidade</b> está pronta. A plataforma reúne as secretarias da sua cidade em um só lugar, começando pelo <b>UNIfrotas</b>.</p>
        <p><a href="https://app.unicidade.com.br" style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">Acessar a plataforma</a></p>
        <p style="color:#64748b;font-size:13px">Dúvidas? Responda este e-mail.</p></div>`,
    }),
  });
  await admin.from('outbox').insert({ to: email, subject: 'Bem-vindo(a) ao UNIcidade', kind: 'welcome' });
}

Deno.serve(async (req) => {
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return new Response('unauthorized', { status: 401 });
  const { data: p } = await admin.from('profiles').select('*').eq('id', user.id).single();
  if (p && !p.welcomed) {
    await sendWelcome(p.email, p.name);
    await admin.from('profiles').update({ welcomed: true }).eq('id', user.id);
  }
  return Response.json({ ok: true });
});
