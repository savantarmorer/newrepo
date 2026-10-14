-- ============================================================================
-- Ágora · 001 · Extensões, tipos e tabelas
-- ============================================================================
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------- tipos
create type public.papel_usuario as enum ('membro', 'coordenador', 'admin');
create type public.status_assinatura as enum ('ativo', 'inativo');
create type public.status_topico as enum ('aberto', 'resolvido', 'arquivado');
create type public.status_artigo as enum ('rascunho', 'em_revisao', 'publicado', 'recusado');
create type public.papel_autoria as enum ('autor', 'coautor', 'revisor');
create type public.parecer_revisao as enum ('aprovar', 'pedir_mudancas', 'recusar');
create type public.tipo_salvo as enum ('topico', 'artigo', 'trilha');
create type public.status_projeto as enum ('planejamento', 'ativo', 'concluido', 'cancelado');
create type public.papel_projeto as enum ('coordenador', 'voluntario');
create type public.status_tarefa as enum ('a_fazer', 'fazendo', 'feito');
create type public.status_rsvp as enum ('vou', 'talvez', 'nao_vou');
create type public.tipo_lancamento as enum ('entrada', 'saida');
create type public.status_doacao as enum ('pendente', 'confirmada', 'falhou');
create type public.tipo_proposta as enum ('geral', 'financeira', 'regimento', 'nucleo');
create type public.natureza_proposta as enum ('comunitaria', 'onchain');
create type public.status_proposta as enum ('rascunho', 'debate', 'votacao', 'aprovada', 'rejeitada', 'bloqueada', 'retirada');
create type public.opcao_voto as enum ('favor', 'contra', 'abstencao', 'bloqueio');
create type public.resultado_decisao as enum ('aprovada', 'rejeitada', 'bloqueada');
create type public.status_denuncia as enum ('aberta', 'resolvida', 'descartada');
create type public.tipo_item_moderavel as enum ('topico', 'resposta', 'artigo', 'proposta', 'proposta_comentario', 'projeto', 'evento', 'perfil');
create type public.acao_moderacao as enum ('manter', 'ocultar', 'restaurar', 'advertir', 'suspender', 'descartar');

-- ---------------------------------------------------------------- utilitário updated_at
create or replace function public.tocar_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- configurações
create table public.configuracoes (
  chave text primary key,
  valor jsonb not null,
  descricao text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- núcleos e perfis
create table public.nucleos (
  id uuid primary key default gen_random_uuid(),
  cidade text not null,
  estado char(2) not null,
  descricao text,
  coordenador_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cidade, estado)
);

create table public.profiles (
  id uuid primary key references auth.users (id),
  nome_exibicao text not null default 'Novo membro',
  pseudonimo text,
  pseudonimo_ativo boolean not null default false,
  bio text,
  avatar_url text,
  cidade text,
  estado char(2),
  nucleo_id uuid references public.nucleos (id) on delete set null,
  papel public.papel_usuario not null default 'membro',
  status_assinatura public.status_assinatura not null default 'inativo',
  assinatura_valida_ate timestamptz,
  reputacao_total integer not null default 0,
  nivel smallint not null default 1 check (nivel between 1 and 4),
  interesses text[] not null default '{}',
  aceitou_codigo_conduta_em timestamptz,
  onboarding_concluido_em timestamptz,
  suspenso_ate timestamptz,
  preferencias_notificacao jsonb not null default '{}'::jsonb,
  excluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pseudonimo_obrigatorio check (not pseudonimo_ativo or coalesce(length(trim(pseudonimo)), 0) >= 2)
);
alter table public.nucleos add constraint nucleos_coordenador_fk foreign key (coordenador_id) references public.profiles (id) on delete set null;
create index profiles_nucleo_idx on public.profiles (nucleo_id);
create index profiles_status_idx on public.profiles (status_assinatura);

-- ---------------------------------------------------------------- biblioteca
create table public.temas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  slug text not null unique,
  descricao text,
  icone text,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topicos (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null references public.temas (id),
  autor_id uuid not null references public.profiles (id),
  titulo text not null check (length(trim(titulo)) between 5 and 200),
  corpo_md text not null default '',
  fixado boolean not null default false,
  trancado boolean not null default false,
  status public.status_topico not null default 'aberto',
  oculto boolean not null default false,
  editado_em timestamptz,
  ultima_atividade_em timestamptz not null default now(),
  excluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index topicos_tema_idx on public.topicos (tema_id, created_at desc);
create index topicos_autor_idx on public.topicos (autor_id);
create index topicos_atividade_idx on public.topicos (ultima_atividade_em desc);

create table public.respostas (
  id uuid primary key default gen_random_uuid(),
  topico_id uuid not null references public.topicos (id) on delete cascade,
  autor_id uuid not null references public.profiles (id),
  corpo_md text not null,
  resposta_pai_id uuid references public.respostas (id) on delete cascade,
  marcada_como_util boolean not null default false,
  oculto boolean not null default false,
  editado_em timestamptz,
  excluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index respostas_topico_idx on public.respostas (topico_id, created_at);
create index respostas_autor_idx on public.respostas (autor_id);

create table public.artigos (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null references public.temas (id),
  criado_por uuid not null references public.profiles (id),
  titulo text not null check (length(trim(titulo)) between 5 and 200),
  resumo text,
  corpo_md text not null default '',
  capa_url text,
  status public.status_artigo not null default 'rascunho',
  rodada_revisao integer not null default 0,
  topico_origem_id uuid references public.topicos (id) on delete set null,
  publicado_em timestamptz,
  oculto boolean not null default false,
  excluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index artigos_tema_idx on public.artigos (tema_id, publicado_em desc);
create index artigos_status_idx on public.artigos (status);

create table public.artigo_autores (
  artigo_id uuid not null references public.artigos (id) on delete cascade,
  profile_id uuid not null references public.profiles (id),
  papel public.papel_autoria not null,
  created_at timestamptz not null default now(),
  primary key (artigo_id, profile_id, papel)
);
create index artigo_autores_profile_idx on public.artigo_autores (profile_id);

create table public.revisoes (
  id uuid primary key default gen_random_uuid(),
  artigo_id uuid not null references public.artigos (id) on delete cascade,
  revisor_id uuid not null references public.profiles (id),
  rodada integer not null,
  parecer public.parecer_revisao not null,
  comentario text not null check (length(trim(comentario)) >= 10),
  created_at timestamptz not null default now(),
  unique (artigo_id, revisor_id, rodada)
);

create table public.trilhas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  tema_id uuid references public.temas (id),
  curador_id uuid not null references public.profiles (id),
  nivel_dificuldade smallint not null default 1 check (nivel_dificuldade between 1 and 3),
  capa_url text,
  publicada boolean not null default false,
  destaque boolean not null default false,
  publicada_em timestamptz,
  excluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trilha_itens (
  trilha_id uuid not null references public.trilhas (id) on delete cascade,
  artigo_id uuid not null references public.artigos (id),
  ordem integer not null,
  primary key (trilha_id, artigo_id)
);

create table public.progresso_trilha (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  trilha_id uuid not null references public.trilhas (id) on delete cascade,
  artigo_id uuid not null references public.artigos (id) on delete cascade,
  concluido_em timestamptz not null default now(),
  primary key (profile_id, trilha_id, artigo_id)
);

create table public.trilhas_concluidas (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  trilha_id uuid not null references public.trilhas (id) on delete cascade,
  concluida_em timestamptz not null default now(),
  primary key (profile_id, trilha_id)
);

create table public.salvos (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tipo public.tipo_salvo not null,
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, tipo, item_id)
);

-- ---------------------------------------------------------------- mutirão
create table public.projetos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(trim(titulo)) between 5 and 160),
  descricao_md text not null default '',
  causa text not null,
  nucleo_id uuid references public.nucleos (id) on delete set null,
  coordenador_id uuid not null references public.profiles (id),
  status public.status_projeto not null default 'planejamento',
  meta_financeira numeric(12, 2) check (meta_financeira is null or meta_financeira >= 0),
  data_inicio date,
  data_fim date,
  capa_url text,
  oculto boolean not null default false,
  concluido_em timestamptz,
  excluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (data_fim is null or data_inicio is null or data_fim >= data_inicio)
);
create index projetos_status_idx on public.projetos (status, created_at desc);
create index projetos_nucleo_idx on public.projetos (nucleo_id);

create table public.projeto_membros (
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  profile_id uuid not null references public.profiles (id),
  papel public.papel_projeto not null default 'voluntario',
  created_at timestamptz not null default now(),
  primary key (projeto_id, profile_id)
);
create index projeto_membros_profile_idx on public.projeto_membros (profile_id);

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  titulo text not null check (length(trim(titulo)) >= 3),
  descricao text,
  responsavel_id uuid references public.profiles (id),
  criado_por uuid references public.profiles (id),
  status public.status_tarefa not null default 'a_fazer',
  prazo date,
  horas_estimadas numeric(6, 1),
  excluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tarefas_projeto_idx on public.tarefas (projeto_id, status);
create index tarefas_responsavel_idx on public.tarefas (responsavel_id);

create table public.horas_voluntariado (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  projeto_id uuid not null references public.projetos (id),
  tarefa_id uuid references public.tarefas (id) on delete set null,
  horas numeric(5, 2) not null check (horas > 0 and horas <= 24),
  descricao text not null check (length(trim(descricao)) >= 5),
  confirmado_por uuid references public.profiles (id),
  confirmado_em timestamptz,
  recusado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (confirmado_por is null or confirmado_por <> profile_id)
);
create index horas_projeto_idx on public.horas_voluntariado (projeto_id, confirmado_em);
create index horas_profile_idx on public.horas_voluntariado (profile_id);

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  nucleo_id uuid references public.nucleos (id) on delete set null,
  projeto_id uuid references public.projetos (id) on delete set null,
  criado_por uuid not null references public.profiles (id),
  local_nome text,
  endereco text,
  inicio timestamptz not null,
  fim timestamptz not null,
  vagas integer check (vagas is null or vagas > 0),
  excluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fim > inicio)
);
create index eventos_inicio_idx on public.eventos (inicio);

-- O código de check-in fica numa tabela separada: RLS não esconde colunas e o
-- código não pode vazar para quem só tem acesso de leitura ao evento.
create table public.eventos_codigos (
  evento_id uuid primary key references public.eventos (id) on delete cascade,
  codigo_checkin text not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)
);

create table public.rsvps (
  evento_id uuid not null references public.eventos (id) on delete cascade,
  profile_id uuid not null references public.profiles (id),
  status public.status_rsvp not null default 'vou',
  presente boolean not null default false,
  checkin_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (evento_id, profile_id)
);

create table public.caixa_lancamentos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos (id),
  tipo public.tipo_lancamento not null,
  valor numeric(12, 2) not null check (valor > 0),
  descricao text not null check (length(trim(descricao)) >= 3),
  categoria text not null,
  comprovante_url text,
  lancado_por uuid references public.profiles (id),
  estorno_de uuid references public.caixa_lancamentos (id),
  doacao_id uuid,
  data date not null default current_date,
  created_at timestamptz not null default now()
);
create index caixa_projeto_idx on public.caixa_lancamentos (projeto_id, data desc);
create unique index caixa_estorno_unico on public.caixa_lancamentos (estorno_de) where estorno_de is not null;

create table public.doacoes (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos (id),
  doador_id uuid references public.profiles (id),
  valor numeric(12, 2) not null check (valor >= 1),
  anonima boolean not null default false,
  status public.status_doacao not null default 'pendente',
  gateway text not null default 'mock',
  gateway_ref text,
  pix_copia_cola text,
  expira_em timestamptz,
  confirmada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not anonima or doador_id is null)
);
create unique index doacoes_gateway_ref_idx on public.doacoes (gateway, gateway_ref) where gateway_ref is not null;
alter table public.caixa_lancamentos add constraint caixa_doacao_fk foreign key (doacao_id) references public.doacoes (id);
create unique index caixa_doacao_unica on public.caixa_lancamentos (doacao_id) where doacao_id is not null;

-- ---------------------------------------------------------------- assembleia
create table public.propostas (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.profiles (id),
  titulo text not null check (length(trim(titulo)) between 5 and 200),
  contexto_md text not null default '',
  proposta_md text not null default '',
  tipo public.tipo_proposta not null default 'geral',
  natureza public.natureza_proposta not null default 'comunitaria',
  escopo_nucleo_id uuid references public.nucleos (id),
  status public.status_proposta not null default 'rascunho',
  rodada integer not null default 1,
  debate_iniciado_em timestamptz,
  debate_ate timestamptz,
  votacao_ate timestamptz,
  quorum_minimo numeric(5, 4) not null default 0.10 check (quorum_minimo > 0 and quorum_minimo <= 1),
  limiar_aprovacao numeric(5, 4) not null default 0.60 check (limiar_aprovacao > 0.5 and limiar_aprovacao <= 1),
  membros_aptos integer,
  lembrete_24h_enviado boolean not null default false,
  oculto boolean not null default false,
  excluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tipo <> 'nucleo' or escopo_nucleo_id is not null)
);
create index propostas_status_idx on public.propostas (status, votacao_ate);

create table public.proposta_comentarios (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.propostas (id) on delete cascade,
  autor_id uuid not null references public.profiles (id),
  corpo_md text not null,
  resposta_pai_id uuid references public.proposta_comentarios (id) on delete cascade,
  oculto boolean not null default false,
  editado_em timestamptz,
  excluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index proposta_comentarios_idx on public.proposta_comentarios (proposta_id, created_at);

create table public.votos (
  proposta_id uuid not null references public.propostas (id) on delete cascade,
  profile_id uuid not null references public.profiles (id),
  rodada integer not null default 1,
  voto public.opcao_voto not null,
  justificativa text,
  peso smallint not null default 1 check (peso = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (proposta_id, profile_id, rodada),
  constraint bloqueio_justificado check (voto <> 'bloqueio' or length(trim(coalesce(justificativa, ''))) >= 200)
);

create table public.decisoes (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.propostas (id),
  rodada integer not null default 1,
  resultado public.resultado_decisao not null,
  resumo_md text not null,
  total_votos integer not null,
  votos_favor integer not null default 0,
  votos_contra integer not null default 0,
  abstencoes integer not null default 0,
  bloqueios integer not null default 0,
  quorum_exigido integer not null default 0,
  quorum_atingido boolean not null default false,
  registrada_em timestamptz not null default now(),
  unique (proposta_id, rodada)
);

-- ---------------------------------------------------------------- reputação, notificações
create table public.reputacao_eventos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  acao text not null,
  pontos integer not null,
  referencia_tipo text,
  referencia_id uuid,
  criado_em timestamptz not null default now()
);
create index reputacao_profile_idx on public.reputacao_eventos (profile_id, criado_em desc);

create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  corpo text,
  link text,
  lida boolean not null default false,
  chave_unica text,
  push_enviado_em timestamptz,
  created_at timestamptz not null default now()
);
create index notificacoes_profile_idx on public.notificacoes (profile_id, created_at desc);
create unique index notificacoes_chave_idx on public.notificacoes (profile_id, chave_unica) where chave_unica is not null;
create index notificacoes_push_pendente_idx on public.notificacoes (created_at) where push_enviado_em is null;

create table public.dispositivos_push (
  token text primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  plataforma text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- moderação
create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  denunciante_id uuid not null references public.profiles (id),
  tipo_item public.tipo_item_moderavel not null,
  item_id uuid not null,
  motivo text not null check (length(trim(motivo)) >= 10),
  status public.status_denuncia not null default 'aberta',
  resolvida_por uuid references public.profiles (id),
  resolucao text,
  resolvida_em timestamptz,
  created_at timestamptz not null default now()
);
create index denuncias_status_idx on public.denuncias (status, created_at);

create table public.log_moderacao (
  id uuid primary key default gen_random_uuid(),
  moderador_id uuid references public.profiles (id),
  acao public.acao_moderacao not null,
  item_tipo public.tipo_item_moderavel not null,
  item_id uuid not null,
  motivo text not null,
  criado_em timestamptz not null default now()
);

-- Guarda o texto original do conteúdo ocultado (somente admins leem; permite recurso)
create table public.conteudo_oculto (
  item_tipo public.tipo_item_moderavel not null,
  item_id uuid not null,
  titulo_original text,
  corpo_original text,
  ocultado_por uuid references public.profiles (id),
  ocultado_em timestamptz not null default now(),
  primary key (item_tipo, item_id)
);

-- ---------------------------------------------------------------- updated_at
do $$
declare t text;
begin
  foreach t in array array['nucleos','profiles','temas','topicos','respostas','artigos','trilhas','projetos','tarefas',
                           'horas_voluntariado','eventos','rsvps','doacoes','propostas','proposta_comentarios','votos','configuracoes']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.tocar_updated_at()',
                   t || '_updated_at', t);
  end loop;
end $$;
