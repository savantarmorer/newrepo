-- Estado operacional do curso JIP.
-- Rode depois de curso-jip.sql e curso-jip-alunos.sql.

create table if not exists public.curso_jip_perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  codinome text check (char_length(codinome) <= 40),
  vertente text check (vertente in ('financeira', 'direitos-humanos', 'osint')),
  opsec_score smallint not null default 0 check (opsec_score between 0 and 100),
  onboarding_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.curso_jip_evidencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 160),
  tipo text not null check (tipo in ('documento', 'pessoa', 'empresa', 'link', 'nota')),
  fonte_url text check (fonte_url is null or char_length(fonte_url) <= 2048),
  observacao text not null default '' check (char_length(observacao) <= 4000),
  relacionada_a uuid references public.curso_jip_evidencias (id) on delete set null,
  status text not null default 'a-verificar'
    check (status in ('a-verificar', 'verificada', 'descartada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.curso_jip_evidencias
  add column if not exists relacionada_a uuid
  references public.curso_jip_evidencias (id) on delete set null;

alter table public.curso_jip_perfis enable row level security;
alter table public.curso_jip_evidencias enable row level security;

drop policy if exists curso_jip_perfis_self on public.curso_jip_perfis;
create policy curso_jip_perfis_self on public.curso_jip_perfis
  for all
  using (auth.uid() = user_id or public.curso_jip_is_teacher())
  with check (auth.uid() = user_id);

drop policy if exists curso_jip_evidencias_self on public.curso_jip_evidencias;
create policy curso_jip_evidencias_self on public.curso_jip_evidencias
  for all
  using (auth.uid() = user_id or public.curso_jip_is_teacher())
  with check (auth.uid() = user_id);

create index if not exists curso_jip_evidencias_user_updated
  on public.curso_jip_evidencias (user_id, updated_at desc);

create or replace function public.curso_jip_pode_ler_catalogo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and public.curso_jip_tem_acesso();
$$;

revoke all on function public.curso_jip_pode_ler_catalogo() from public;
grant execute on function public.curso_jip_pode_ler_catalogo() to authenticated;

grant select, insert, update, delete on table public.curso_jip_perfis to authenticated;
grant select, insert, update, delete on table public.curso_jip_evidencias to authenticated;
