-- Liberação de alunos que compraram o curso.
-- Rode no SQL Editor DEPOIS de curso-jip.sql.
-- O professor (iuri@piragibe.com.br) entra sem esta tabela.
-- Depois de cada venda, insira o e-mail da conta Google/login:

-- insert into public.curso_jip_alunos (email, fonte)
-- values ('aluno@gmail.com', 'hotmart')
-- on conflict (email) do nothing;

create table if not exists public.curso_jip_alunos (
  email text primary key,
  fonte text not null default 'manual',
  created_at timestamptz not null default now()
);

create or replace function public.curso_jip_norm_email()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

drop trigger if exists curso_jip_alunos_email on public.curso_jip_alunos;
create trigger curso_jip_alunos_email
before insert or update on public.curso_jip_alunos
for each row execute procedure public.curso_jip_norm_email();

update public.curso_jip_alunos set email = lower(trim(email)) where email <> lower(trim(email));

alter table public.curso_jip_alunos enable row level security;

drop policy if exists curso_jip_alunos_self on public.curso_jip_alunos;
create policy curso_jip_alunos_self on public.curso_jip_alunos
  for select using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or lower(email) = lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'email', ''))
    or public.curso_jip_is_teacher()
  );

drop policy if exists curso_jip_alunos_teacher on public.curso_jip_alunos;
create policy curso_jip_alunos_teacher on public.curso_jip_alunos
  for insert with check (public.curso_jip_is_teacher());

drop policy if exists curso_jip_alunos_teacher_del on public.curso_jip_alunos;
create policy curso_jip_alunos_teacher_del on public.curso_jip_alunos
  for delete using (public.curso_jip_is_teacher());

create or replace function public.curso_jip_tem_acesso()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.curso_jip_is_teacher()
    or exists (
      select 1
      from public.curso_jip_alunos a
      where lower(a.email) in (
        lower(coalesce(auth.jwt() ->> 'email', '')),
        lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'email', ''))
      )
    );
$$;

grant execute on function public.curso_jip_tem_acesso() to anon, authenticated;
grant select, insert, delete on table public.curso_jip_alunos to authenticated;
