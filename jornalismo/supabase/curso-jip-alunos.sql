-- Liberação de alunos que compraram o curso.
-- Rode no SQL Editor DEPOIS de curso-jip.sql.
-- O professor (iuri@piragibe.com.br) entra sem esta tabela.
-- Depois de cada venda, insira o e-mail usado na compra:

-- insert into public.curso_jip_alunos (email, fonte)
-- values ('aluno@email.com', 'hotmart')
-- on conflict (email) do nothing;

create table if not exists public.curso_jip_alunos (
  email text primary key,
  fonte text not null default 'manual',
  created_at timestamptz not null default now()
);

alter table public.curso_jip_alunos enable row level security;

drop policy if exists curso_jip_alunos_self on public.curso_jip_alunos;
create policy curso_jip_alunos_self on public.curso_jip_alunos
  for select using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.curso_jip_is_teacher()
  );

drop policy if exists curso_jip_alunos_teacher on public.curso_jip_alunos;
create policy curso_jip_alunos_teacher on public.curso_jip_alunos
  for insert with check (public.curso_jip_is_teacher());

drop policy if exists curso_jip_alunos_teacher_del on public.curso_jip_alunos;
create policy curso_jip_alunos_teacher_del on public.curso_jip_alunos
  for delete using (public.curso_jip_is_teacher());
