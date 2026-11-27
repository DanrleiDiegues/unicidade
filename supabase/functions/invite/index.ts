// Admin da plataforma convida alguém para uma cidade: cria a conta, vincula o papel e manda boas-vindas.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendWelcome } from '../welcome/index.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await admin.auth.getUser(jwt);
  const { data: me } = await admin.from('profiles').select('platform_admin').eq('id', user?.id).single();
  if (!me?.platform_admin) return new Response('forbidden', { status: 403 });

  const { name, email, tenant_id, role } = await req.json();
  // Cria o usuário e manda o link para ele definir a senha
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { name } });
  if (error && !error.message.includes('already')) return Response.json({ error: error.message }, { status: 400 });
  const uid = data?.user?.id ?? (await admin.from('profiles').select('id').eq('email', email).single()).data?.id;
  await admin.from('members').upsert({ user_id: uid, tenant_id, role });
  await sendWelcome(email, name);
  await admin.from('profiles').update({ welcomed: true }).eq('id', uid);
  return Response.json({ ok: true });
});
