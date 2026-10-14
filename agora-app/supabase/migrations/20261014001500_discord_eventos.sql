-- Prévia pelo Discord: eventos do Mutirão e votações da Assembleia viram eventos
-- agendados no servidor do Discord. Esta tabela liga cada item ao evento criado
-- pelo bot, para atualizar ou cancelar depois. Só o bot (service_role) acessa.
create table public.discord_eventos (
  origem text not null check (origem in ('evento', 'proposta')),
  origem_id uuid not null,
  guild_id text not null,
  discord_evento_id text not null,
  assinatura text not null,               -- resumo do que foi publicado (detecta mudanças)
  sincronizado_em timestamptz not null default now(),
  primary key (origem, origem_id, guild_id)
);

comment on table public.discord_eventos is 'Eventos agendados que o bot do Discord criou para eventos do Mutirão e votações';

alter table public.discord_eventos enable row level security;
revoke all on public.discord_eventos from anon, authenticated;
grant all on public.discord_eventos to service_role;
