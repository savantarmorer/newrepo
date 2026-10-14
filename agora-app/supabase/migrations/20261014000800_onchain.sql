-- ============================================================================
-- Ágora · 008 · Ponte on-chain: carteiras, épocas de recompensa (Merkle),
-- créditos de Dracma (DRC), espelho do Governor e delegações.
-- Nada aqui movimenta tokens: o banco só calcula e espelha. Quem assina
-- transações são as Edge Functions (chaves em variáveis de ambiente) e a
-- carteira embutida de cada membro.
-- ============================================================================

create type public.tipo_carteira as enum ('embutida', 'externa');
create type public.status_epoca as enum ('calculada', 'publicada', 'falhou');
create type public.estado_proposta_onchain as enum
  ('pendente', 'ativa', 'cancelada', 'derrotada', 'aprovada', 'na_fila', 'expirada', 'executada');

create table public.carteiras (
  profile_id uuid primary key references public.profiles (id),
  endereco text not null unique check (endereco ~ '^0x[0-9a-f]{40}$'),
  tipo public.tipo_carteira not null default 'embutida',
  conta_dona text check (conta_dona is null or conta_dona ~ '^0x[0-9a-f]{40}$'),
  sbt_token_id numeric(78, 0),
  sbt_nivel smallint,
  sbt_atualizado_em timestamptz,
  verificada_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.epocas_recompensa (
  id integer primary key,
  inicio timestamptz not null,
  fim timestamptz not null,
  merkle_root text check (merkle_root is null or merkle_root ~ '^0x[0-9a-f]{64}$'),
  total_drc numeric(38, 18) not null default 0,
  total_wei numeric(78, 0) not null default 0,
  beneficiarios integer not null default 0,
  status public.status_epoca not null default 'calculada',
  tx_hash text,
  publicada_em timestamptz,
  created_at timestamptz not null default now(),
  check (fim > inicio)
);

-- Livro-razão de créditos pendentes: nasce de cada evento de reputação
create table public.drc_pendentes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  reputacao_evento_id uuid references public.reputacao_eventos (id),
  valor numeric(38, 18) not null,
  origem text not null default 'reputacao',
  epoca_id integer references public.epocas_recompensa (id),
  created_at timestamptz not null default now()
);
create index drc_pendentes_abertos_idx on public.drc_pendentes (profile_id) where epoca_id is null;

create table public.creditos_drc (
  profile_id uuid not null references public.profiles (id),
  epoca_id integer not null references public.epocas_recompensa (id),
  endereco text not null,
  valor numeric(38, 18) not null check (valor > 0),
  valor_wei numeric(78, 0) not null,
  prova jsonb,
  indice integer,
  resgatado_tx text,
  resgatado_em timestamptz,
  created_at timestamptz not null default now(),
  primary key (profile_id, epoca_id)
);

create table public.propostas_onchain (
  proposal_id text primary key,
  proposta_id_app uuid references public.propostas (id),
  proponente text not null,
  descricao text not null,
  descricao_hash text,
  acoes jsonb not null default '[]'::jsonb,
  estado public.estado_proposta_onchain not null default 'pendente',
  modo_voto text,
  votos_favor numeric(78, 0) not null default 0,
  votos_contra numeric(78, 0) not null default 0,
  abstencoes numeric(78, 0) not null default 0,
  quorum numeric(78, 0),
  bloco_snapshot bigint,
  bloco_fim bigint,
  eta timestamptz,
  tx_criacao text,
  tx_execucao text,
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.votos_onchain (
  proposal_id text not null references public.propostas_onchain (proposal_id) on delete cascade,
  eleitor text not null,
  suporte smallint not null check (suporte between 0 and 2),
  peso numeric(78, 0) not null,
  motivo text,
  tx_hash text,
  bloco bigint,
  primary key (proposal_id, eleitor)
);

create table public.delegacoes (
  delegante text primary key,
  delegado text not null,
  bloco bigint not null,
  tx_hash text,
  atualizado_em timestamptz not null default now()
);

create table public.movimentos_drc (
  tx_hash text not null,
  log_index integer not null,
  de text not null,
  para text not null,
  valor_wei numeric(78, 0) not null,
  bloco bigint not null,
  ocorrido_em timestamptz,
  primary key (tx_hash, log_index)
);
create index movimentos_drc_de_idx on public.movimentos_drc (de);
create index movimentos_drc_para_idx on public.movimentos_drc (para);

create table public.indexador_estado (
  chave text primary key,
  ultimo_bloco bigint not null default 0,
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------- crédito pendente a cada evento de reputação
create or replace function public.creditar_drc_pendente() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_taxa numeric := public.config_num('drc', 'taxa_conversao', 1);
begin
  -- Pontos positivos geram crédito; negativos reduzem créditos pendentes.
  insert into public.drc_pendentes (profile_id, reputacao_evento_id, valor)
  values (new.profile_id, new.id, new.pontos * v_taxa);
  return new;
end $$;
create trigger reputacao_eventos_drc after insert on public.reputacao_eventos
  for each row execute function public.creditar_drc_pendente();

create trigger drc_pendentes_imutavel before delete on public.drc_pendentes
  for each row execute function public.bloquear_alteracao();

-- Saldo pendente do próprio membro
create or replace function public.meu_saldo_drc_pendente() returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(valor), 0) from public.drc_pendentes where profile_id = auth.uid() and epoca_id is null
$$;

-- ---------------------------------------------------------------- fechamento de época (chamado pela Edge Function)
-- Elegíveis: assinatura ativa + carteira com SBT de reputação. Teto por carteira
-- e por época; o excedente e os saldos de não elegíveis continuam pendentes.
create or replace function public.preparar_epoca(p_epoca integer, p_inicio timestamptz, p_fim timestamptz)
returns table (profile_id uuid, endereco text, valor numeric, valor_wei numeric)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_cfg jsonb := public.config('drc');
  v_teto_carteira numeric := coalesce((v_cfg ->> 'teto_por_carteira_epoca')::numeric, 2000);
  v_teto_epoca numeric := coalesce((v_cfg ->> 'teto_por_epoca')::numeric, 300000);
  v_total numeric;
  v_fator numeric := 1;
  r record;
begin
  if exists (select 1 from public.epocas_recompensa where id = p_epoca) then
    raise exception 'Época % já preparada', p_epoca;
  end if;
  insert into public.epocas_recompensa (id, inicio, fim) values (p_epoca, p_inicio, p_fim);

  create temporary table _saldos on commit drop as
  select d.profile_id, c.endereco, sum(d.valor) as saldo
  from public.drc_pendentes d
  join public.carteiras c on c.profile_id = d.profile_id and c.sbt_token_id is not null
  join public.profiles p on p.id = d.profile_id
  where d.epoca_id is null and d.created_at < p_fim
    and p.excluido_em is null and p.status_assinatura = 'ativo'
    and (p.assinatura_valida_ate is null or p.assinatura_valida_ate >= now())
  group by d.profile_id, c.endereco
  having sum(d.valor) > 0;

  select coalesce(sum(least(saldo, v_teto_carteira)), 0) into v_total from _saldos;
  if v_total > v_teto_epoca then v_fator := v_teto_epoca / v_total; end if;

  for r in select * from _saldos loop
    -- fecha os pendentes do membro nesta época…
    update public.drc_pendentes set epoca_id = p_epoca
     where drc_pendentes.profile_id = r.profile_id and epoca_id is null and created_at < p_fim;
    profile_id := r.profile_id;
    endereco := r.endereco;
    valor := trunc(least(r.saldo, v_teto_carteira) * v_fator, 6);
    valor_wei := trunc(valor * 1e18);
    -- …e devolve o que passou do teto como novo pendente (carry-over)
    if r.saldo - valor > 0 then
      insert into public.drc_pendentes (profile_id, valor, origem) values (r.profile_id, r.saldo - valor, 'excedente_epoca_' || p_epoca);
    end if;
    if valor > 0 then
      insert into public.creditos_drc (profile_id, epoca_id, endereco, valor, valor_wei)
      values (r.profile_id, p_epoca, r.endereco, valor, valor_wei);
      return next;
    end if;
  end loop;

  update public.epocas_recompensa e set
    total_drc = coalesce((select sum(c.valor) from public.creditos_drc c where c.epoca_id = p_epoca), 0),
    total_wei = coalesce((select sum(c.valor_wei) from public.creditos_drc c where c.epoca_id = p_epoca), 0),
    beneficiarios = (select count(*) from public.creditos_drc c where c.epoca_id = p_epoca)
  where e.id = p_epoca;
end $$;
revoke execute on function public.preparar_epoca(integer, timestamptz, timestamptz) from public, anon, authenticated;

-- Grava provas Merkle: [{"profile_id": "...", "indice": 0, "prova": ["0x..", ...]}]
create or replace function public.registrar_provas_epoca(p_epoca integer, p_root text, p_provas jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  update public.epocas_recompensa set merkle_root = lower(p_root) where id = p_epoca;
  for r in select * from jsonb_array_elements(p_provas) loop
    update public.creditos_drc set prova = r -> 'prova', indice = (r ->> 'indice')::integer
     where epoca_id = p_epoca and profile_id = (r ->> 'profile_id')::uuid;
  end loop;
end $$;
revoke execute on function public.registrar_provas_epoca(integer, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------- views públicas para membros
create or replace view public.carteiras_publicas with (security_barrier = true) as
select c.profile_id, public.nome_publico(c.profile_id) as nome_publico, c.endereco, c.sbt_nivel
from public.carteiras c
join public.profiles p on p.id = c.profile_id and p.excluido_em is null
where public.pode_ler();
