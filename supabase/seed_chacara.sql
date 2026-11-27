-- Rode DEPOIS de criar os usuários em Authentication > Users.
update profiles set platform_admin = true, name = 'Danrlei Diegues' where email = 'danrlei.diegueso@gmail.com';
update profiles set name = 'Helton Diegues' where email = 'heltondiegues@gmail.com';
update profiles set name = 'Danrlei Oliveira' where email = 'danrlei.oliveira@estudante.ufjf.br';

insert into tenants (slug, name, uf, plan, modules) values ('chacara', 'Chácara', 'MG', 'free', '{frotas}')
  on conflict (slug) do nothing;

insert into members (user_id, tenant_id, role)
select p.id, t.id, case when p.email = 'motorista@chacara.demo' then 'motorista' else 'geral' end
from profiles p, tenants t
where t.slug = 'chacara'
  and p.email in ('heltondiegues@gmail.com', 'danrlei.oliveira@estudante.ufjf.br', 'motorista@chacara.demo')
on conflict do nothing;

select p.email, m.role, t.name from members m join profiles p on p.id = m.user_id join tenants t on t.id = m.tenant_id;
