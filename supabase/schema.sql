-- UNIcidade — esquema multi-cidade (multi-tenant) para Supabase/Postgres.
-- Um banco só para todas as cidades; cada linha carrega tenant_id e o
-- Row Level Security garante que cada usuário só vê a(s) cidade(s) dele.

create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,              -- chacara -> chacara.unicidade.com.br
  name text not null, uf char(2) default 'MG',
  plan text not null default 'free',      -- trial | free | pro
  modules text[] not null default '{frotas}',
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, email text unique,
  platform_admin boolean default false,   -- só você (dono da plataforma)
  welcomed boolean default false
);

create table members (
  user_id uuid references profiles on delete cascade,
  tenant_id uuid references tenants on delete cascade,
  role text not null check (role in ('geral','motorista')),  -- novos papéis entram aqui (ex.: 'saude')
  primary key (user_id, tenant_id)
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  plate text not null, model text, type text, secretaria text, year int, km int default 0,
  status text default 'disponivel'   -- disponivel | em_uso | manutencao | indisponivel | baixado
);

create table orders (               -- ocorrência / ordem de manutenção (funil de 6 etapas)
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  vehicle_id uuid references vehicles on delete set null,
  title text not null, description text, priority text default 'media',
  type text default 'Corretiva', oficina text, value numeric default 0,
  closed boolean default false, cancelled boolean default false,
  stage smallint not null default 0 check (stage between 0 and 5),
  tasks jsonb not null default '[]', history jsonb not null default '[]',
  created_by uuid references profiles, created_at timestamptz default now()
);

create table fuel (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  vehicle_id uuid references vehicles on delete cascade,
  liters numeric, value numeric, km int, date timestamptz default now()
);

create table moves (                -- saída e devolução de veículos
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  vehicle_id uuid references vehicles on delete cascade,
  setor text, finalidade text, driver text,
  km_out int, km_in int, out_at timestamptz default now(), in_at timestamptz
);

create table outbox (               -- registro dos e-mails enviados (boas-vindas etc.)
  id uuid primary key default gen_random_uuid(),
  "to" text, subject text, kind text, at timestamptz default now()
);

create index on vehicles (tenant_id);
create index on orders (tenant_id, stage);
create index on fuel (tenant_id, date);

-- Perfil criado automaticamente a cada novo login/cadastro
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user after insert on auth.users for each row execute function handle_new_user();

-- Funções auxiliares usadas pelas políticas
create function is_admin() returns boolean language sql stable security definer set search_path = public as
  $$ select coalesce((select platform_admin from profiles where id = auth.uid()), false) $$;
create function role_in(t uuid) returns text language sql stable security definer set search_path = public as
  $$ select role from members where user_id = auth.uid() and tenant_id = t $$;

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table members enable row level security;
alter table vehicles enable row level security;
alter table orders enable row level security;
alter table fuel enable row level security;
alter table moves enable row level security;
alter table outbox enable row level security;

create policy t_read on tenants for select using (is_admin() or role_in(id) is not null);
create policy t_admin on tenants for all using (is_admin()) with check (is_admin());
create policy p_read on profiles for select using (id = auth.uid() or is_admin()
  or exists (select 1 from members a join members b using (tenant_id) where a.user_id = auth.uid() and a.role = 'geral' and b.user_id = profiles.id));
create policy m_read on members for select using (user_id = auth.uid() or is_admin() or role_in(tenant_id) = 'geral');
create policy m_admin on members for all using (is_admin()) with check (is_admin());

-- Frota: gestão geral vê e edita tudo da cidade; motorista vê veículos e só as PRÓPRIAS ocorrências
create policy v_read on vehicles for select using (is_admin() or role_in(tenant_id) is not null);
create policy v_write on vehicles for all using (is_admin() or role_in(tenant_id) = 'geral') with check (is_admin() or role_in(tenant_id) = 'geral');
create policy v_km on vehicles for update using (role_in(tenant_id) = 'motorista');
create policy o_read on orders for select using (is_admin() or role_in(tenant_id) = 'geral' or (role_in(tenant_id) = 'motorista' and created_by = auth.uid()));
create policy o_new on orders for insert with check (role_in(tenant_id) is not null and created_by = auth.uid());
create policy o_edit on orders for update using (is_admin() or role_in(tenant_id) = 'geral');
create policy f_read on fuel for select using (is_admin() or role_in(tenant_id) = 'geral');
create policy f_write on fuel for all using (is_admin() or role_in(tenant_id) = 'geral') with check (is_admin() or role_in(tenant_id) = 'geral');
create policy mv_all on moves for all using (is_admin() or role_in(tenant_id) = 'geral') with check (is_admin() or role_in(tenant_id) = 'geral');
create policy e_admin on outbox for select using (is_admin());

-- Cadastro grátis: cria uma cidade de teste e coloca o usuário como gestão geral
create function create_trial_city(city_name text) returns uuid language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  insert into tenants (slug, name, plan, modules)
    values (substr(md5(random()::text), 1, 8), city_name || ' (teste)', 'trial', '{frotas}') returning id into t;
  insert into members (user_id, tenant_id, role) values (auth.uid(), t, 'geral');
  return t;
end $$;

-- Acesso da API (o projeto foi criado sem conceder acesso automático às tabelas)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function create_trial_city(text), is_admin(), role_in(uuid) to authenticated;

-- Dados iniciais: depois de criar as contas pelo painel do Supabase (Authentication > Users)
-- update profiles set platform_admin = true where email = 'danrlei.diegueso@gmail.com';
-- insert into tenants (slug, name, uf, modules) values ('chacara', 'Chácara', 'MG', '{frotas}');
-- insert into members select p.id, t.id, 'geral' from profiles p, tenants t
--   where p.email = 'danrlei.oliveira@estudante.ufjf.br' and t.slug = 'chacara';

-- Convites pré-aprovados (aplicado em 26/11/2026): quem se cadastrar ou for convidado com o e-mail
-- já entra na cidade com o papel certo, e não ganha cidade de teste.
create table if not exists invites (email text primary key, tenant_slug text not null, role text not null, name text);
alter table invites enable row level security;
create policy i_admin on invites for all using (is_admin()) with check (is_admin());
grant select, insert, update, delete on invites to authenticated;
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare i invites;
begin
  select * into i from invites where lower(email) = lower(new.email);
  insert into profiles (id, email, name)
    values (new.id, new.email, coalesce(i.name, new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  if i.email is not null then
    insert into members (user_id, tenant_id, role) select new.id, t.id, i.role from tenants t where t.slug = i.tenant_slug on conflict do nothing;
  end if;
  return new;
end $$;
create or replace function create_trial_city(city_name text) returns uuid language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  select tenant_id into t from members where user_id = auth.uid() limit 1;
  if t is not null then return t; end if;
  insert into tenants (slug, name, plan, modules)
    values (substr(md5(random()::text), 1, 8), city_name || ' (teste)', 'trial', '{frotas}') returning id into t;
  insert into members (user_id, tenant_id, role) values (auth.uid(), t, 'geral');
  return t;
end $$;

-- Brasão da cidade (26/11/2026)
alter table tenants add column if not exists logo_url text;
update tenants set logo_url = '/logos/chacara.png' where slug = 'chacara';

-- Formulários 01, 02 e 03 dentro da ocorrência (26/11/2026)
alter table orders add column if not exists forms jsonb not null default '{}';

-- Fornecedores (lista fixa por cidade, usada na OS e no Formulário 02)
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  name text not null, kind text, doc text, phone text,
  created_at timestamptz default now()
);
alter table suppliers enable row level security;
create policy s_read on suppliers for select using (is_admin() or role_in(tenant_id) is not null);
create policy s_write on suppliers for all using (is_admin() or role_in(tenant_id) = 'geral') with check (is_admin() or role_in(tenant_id) = 'geral');
grant select, insert, update, delete on suppliers to authenticated;

-- Mapa da cidade: código IBGE e centro do município, local das ocorrências e prédios públicos
alter table tenants add column if not exists ibge text, add column if not exists lat double precision, add column if not exists lng double precision;
alter table orders add column if not exists lat double precision, add column if not exists lng double precision;
create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  name text not null, kind text default 'outro', secretaria text,
  lat double precision not null, lng double precision not null,
  created_at timestamptz default now()
);
alter table places enable row level security;
create policy p_read on places for select using (is_admin() or role_in(tenant_id) is not null);
create policy p_write on places for all using (is_admin() or role_in(tenant_id) = 'geral') with check (is_admin() or role_in(tenant_id) = 'geral');
grant select, insert, update, delete on places to authenticated;

-- Cidadão 360º (dados pessoais: só perfil geral; acessos registrados)
create table if not exists citizens (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants on delete cascade,
  nome text not null, cpf text, nascimento date, telefone text, email text, endereco text, bairro text,
  tags text[] default '{}', notas text, created_at timestamptz default now());
create table if not exists citizen_events (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants on delete cascade,
  citizen_id uuid not null references citizens on delete cascade, area text not null, titulo text not null,
  data date default current_date, detalhe text, por text, created_at timestamptz default now());
create table if not exists citizen_access (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants on delete cascade,
  citizen_id uuid not null references citizens on delete cascade, user_id uuid, user_name text, at timestamptz default now());
alter table citizens enable row level security;
alter table citizen_events enable row level security;
alter table citizen_access enable row level security;
create policy c_all on citizens for all using (is_admin() or role_in(tenant_id) = 'geral') with check (is_admin() or role_in(tenant_id) = 'geral');
create policy ce_all on citizen_events for all using (is_admin() or role_in(tenant_id) = 'geral') with check (is_admin() or role_in(tenant_id) = 'geral');
create policy ca_read on citizen_access for select using (is_admin() or role_in(tenant_id) = 'geral');
create policy ca_ins on citizen_access for insert with check ((is_admin() or role_in(tenant_id) = 'geral') and user_id = auth.uid());
grant select, insert, update, delete on citizens, citizen_events to authenticated;
grant select, insert on citizen_access to authenticated;

-- Extras (mapa/prédios) só para o perfil geral (prefeito, vice e assessoria)
drop policy if exists p_read on places;
create policy p_read on places for select using (is_admin() or role_in(tenant_id) = 'geral');

-- Funcionários (só perfil geral). Sem CPF/salário.
create table if not exists employees (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants on delete cascade,
  nome text not null, cargo text, secretaria text, vinculo text, desde date, ativo boolean default true,
  telefone text, email text, cnh_cat text, cnh_validade date, siplan_cod int, origem text, notas text,
  created_at timestamptz default now());
alter table employees enable row level security;
create policy e_all on employees for all using (is_admin() or role_in(tenant_id) = 'geral') with check (is_admin() or role_in(tenant_id) = 'geral');
grant select, insert, update, delete on employees to authenticated;

-- Perfis por área (além de geral e motorista)
alter table members drop constraint if exists members_role_check;
alter table members add constraint members_role_check check (role in ('geral','motorista','saude','educacao'));

-- Sugestões de melhoria (qualquer usuário envia; só o admin da plataforma lê tudo e muda o status)
create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants on delete set null,
  user_id uuid not null default auth.uid(), user_name text, user_email text,
  view text, tipo text default 'ideia', texto text not null,
  anexos jsonb default '[]', status text default 'nova', resposta text,
  created_at timestamptz default now());
alter table suggestions enable row level security;
create policy sg_ins on suggestions for insert to authenticated with check (user_id = auth.uid());
create policy sg_read on suggestions for select to authenticated using (user_id = auth.uid() or is_admin());
create policy sg_upd on suggestions for update to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update on suggestions to authenticated;
-- anexos: bucket privado, cada usuário grava na própria pasta; admin lê tudo
insert into storage.buckets (id, name, public, file_size_limit) values ('sugestoes', 'sugestoes', false, 8388608) on conflict (id) do nothing;
create policy sug_up on storage.objects for insert to authenticated with check (bucket_id = 'sugestoes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy sug_read on storage.objects for select to authenticated using (bucket_id = 'sugestoes' and (is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
