-- Prévia da Ágora pelo Discord: liga cada conta do Discord a uma conta da Ágora.
-- Só o bot (service_role) lê e escreve aqui; membros não acessam pelo app.
create table public.discord_vinculos (
  discord_id text primary key,
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  email_tecnico text not null,
  -- true quando a assinatura ativa veio do cargo do Discord (o bot pode desativá-la se o cargo sair)
  assinatura_pelo_discord boolean not null default false,
  criado_em timestamptz not null default now(),
  ultimo_uso_em timestamptz not null default now()
);

comment on table public.discord_vinculos is 'Contas da Ágora criadas/usadas pelo bot do Discord durante a prévia';

alter table public.discord_vinculos enable row level security;
-- Sem políticas: anon/authenticated não veem nada; o service_role ignora RLS.
revoke all on public.discord_vinculos from anon, authenticated;
grant all on public.discord_vinculos to service_role;
