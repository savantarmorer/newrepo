-- Curso Jornalismo Investigativo na Prática
-- Rode no SQL Editor do projeto fveslvzjjixzpwiqcydz (depois das migrações da Ágora).
-- RLS: cada aluno só vê a própria linha. Mentor lê a turma.

create table if not exists public.curso_jip_professores (
  email text primary key
);

insert into public.curso_jip_professores (email)
values ('iuri@piragibe.com.br')
on conflict (email) do nothing;

create table if not exists public.curso_jip_inscricoes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.curso_jip_pautas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  titulo text,
  dados jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.curso_jip_exercicios (
  user_id uuid not null references auth.users (id) on delete cascade,
  aula_id text not null,
  payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  primary key (user_id, aula_id)
);

create table if not exists public.curso_jip_progresso (
  user_id uuid not null references auth.users (id) on delete cascade,
  aula_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, aula_id)
);

create table if not exists public.curso_jip_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  aula_id text,
  mentor_email text not null,
  comentario text not null,
  status text not null default 'lida' check (status in ('lida', 'revisar', 'aprovada')),
  created_at timestamptz not null default now()
);

alter table public.curso_jip_inscricoes enable row level security;
alter table public.curso_jip_pautas enable row level security;
alter table public.curso_jip_exercicios enable row level security;
alter table public.curso_jip_progresso enable row level security;
alter table public.curso_jip_feedback enable row level security;
alter table public.curso_jip_professores enable row level security;

create or replace function public.curso_jip_is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.curso_jip_professores p
    where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists curso_jip_insc_self on public.curso_jip_inscricoes;
create policy curso_jip_insc_self on public.curso_jip_inscricoes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists curso_jip_pauta_self on public.curso_jip_pautas;
create policy curso_jip_pauta_self on public.curso_jip_pautas
  for all using (auth.uid() = user_id or public.curso_jip_is_teacher())
  with check (auth.uid() = user_id or public.curso_jip_is_teacher());

drop policy if exists curso_jip_ex_self on public.curso_jip_exercicios;
create policy curso_jip_ex_self on public.curso_jip_exercicios
  for all using (auth.uid() = user_id or public.curso_jip_is_teacher())
  with check (auth.uid() = user_id);

drop policy if exists curso_jip_prog_self on public.curso_jip_progresso;
create policy curso_jip_prog_self on public.curso_jip_progresso
  for all using (auth.uid() = user_id or public.curso_jip_is_teacher())
  with check (auth.uid() = user_id);

drop policy if exists curso_jip_fb_read on public.curso_jip_feedback;
create policy curso_jip_fb_read on public.curso_jip_feedback
  for select using (auth.uid() = user_id or public.curso_jip_is_teacher());

drop policy if exists curso_jip_fb_teacher on public.curso_jip_feedback;
create policy curso_jip_fb_teacher on public.curso_jip_feedback
  for insert with check (public.curso_jip_is_teacher());

drop policy if exists curso_jip_prof_read on public.curso_jip_professores;
create policy curso_jip_prof_read on public.curso_jip_professores
  for select using (true);
