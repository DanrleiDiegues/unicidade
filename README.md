# UNIcidade

Plataforma única de gestão municipal. Cada cidade é um *tenant*; cada secretaria é um módulo (UNIfrotas, UNIsaúde, UNIeducação, UNInfra…). Um login só, e o acesso depende do papel da pessoa em cada cidade.

## Rodar localmente
```bash
npm install
npm run dev          # sem .env roda em modo demonstração (dados no navegador)
```
Logins da demonstração (senha `unicidade`): `danrlei.oliveira@estudante.ufjf.br` (gestão geral de Chácara), `motorista@chacara.demo` (motorista), `danrlei.diegueso@gmail.com` (admin da plataforma).

## Ligar em produção (Supabase + Cloudflare Pages + Resend)
1. **Supabase**: crie o projeto, rode `supabase/schema.sql` no SQL Editor. Em Authentication, ative e-mail/senha.
2. **Resend**: crie a conta, verifique o domínio `unicidade.com.br` e gere a API key.
3. **Funções de e-mail**: `supabase functions deploy welcome invite` e `supabase secrets set RESEND_API_KEY=...`.
4. **Contas iniciais**: crie os usuários no painel do Supabase e rode as linhas comentadas no fim do `schema.sql`.
5. **Cloudflare Pages**: conecte o repositório do GitHub; build `npm run build`, saída `dist`; variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
6. **Domínio**: `app.unicidade.com.br` no Pages. Para `chacara.unicidade.com.br`, adicione o subdomínio de cada cidade no Pages (até 100 no plano grátis) ou use um Worker com rota curinga `*.unicidade.com.br`.

Cada `git push` na branch `main` publica sozinho; cada pull request ganha um link de prévia.

## Estrutura
```
src/lib/catalog.js   módulos, papéis e o funil de 6 etapas
src/lib/api.js       escolhe o adaptador (demo ou Supabase)
src/lib/demo.js      dados no navegador, para testes e demonstrações
src/lib/supa.js      produção (Supabase)
src/pages/           Auth, Hub (visão geral), Frotas, Motorista, Admin
supabase/            schema.sql (tabelas + segurança por cidade) e funções de e-mail
```
Novo módulo = item em `catalog.js` + uma página em `src/pages` + tabelas com `tenant_id` e as mesmas políticas de RLS.
