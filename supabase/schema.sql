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
