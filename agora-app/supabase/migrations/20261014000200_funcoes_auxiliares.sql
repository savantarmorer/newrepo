-- ============================================================================
-- Ágora · 002 · Configurações padrão, funções de permissão e perfil público
-- ============================================================================

insert into public.configuracoes (chave, valor, descricao) values
  ('pontos', '{
      "resposta_util": 5,
      "artigo_publicado": 40,
      "revisao_concluida": 10,
      "trilha_publicada": 30,
      "hora_voluntariado": 8,
      "presenca_evento": 5,
      "projeto_concluido": 50,
      "proposta_aprovada": 20,
      "conteudo_removido": -20
   }', 'Pontos de reputação por ação'),
  ('niveis', '{"1": 0, "2": 50, "3": 250, "4": 800}', 'Pontuação mínima de cada nível (Aprendiz, Colaborador, Curador, Guardião)'),
  ('assembleia', '{
      "quorum_padrao": 0.10,
      "limiar_padrao": 0.60,
      "limiar_qualificado": 0.6667,
      "bloqueios_maximos": 3,
      "debate_min_dias": 5,
      "votacao_min_dias": 3
   }', 'Regras padrão das propostas comunitárias'),
  ('revisao', '{"aprovacoes_necessarias": 2}', 'Aprovações de curadores distintos para publicar um artigo'),
  ('assinatura', '{"url_ativacao": "https://agora.comunidade.br/assinar", "texto": "Sua assinatura sustenta a Ágora sem anúncios nem venda de dados."}', 'Link externo de ativação da assinatura'),
  ('limites', '{"conteudo_por_hora": 30, "denuncias_por_hora": 10, "doacoes_por_hora": 10}', 'Limites de criação por membro (rate limiting)'),
  ('moderacao', '{"dias_suspensao_padrao": 7}', 'Parâmetros de moderação'),
  ('drc', '{
      "taxa_conversao": 1,
      "teto_por_carteira_epoca": 2000,
      "teto_por_epoca": 300000,
      "decimais": 18
   }', 'Conversão de reputação em créditos de Dracma (DRC) por época'),
  ('onchain', '{
      "rede": "base-sepolia",
      "chain_id": 84532,
      "explorador": "https://sepolia.basescan.org",
      "token": null,
      "reputacao_sbt": null,
      "governor": null,
      "timelock": null,
      "distribuidor": null,
      "fundo_mutirao": null
   }', 'Endereços dos contratos (preenchidos após o deploy)')
on conflict (chave) do nothing;

-- ---------------------------------------------------------------- leitura de configuração
create or replace function public.config(p_chave text) returns jsonb
language sql stable security definer set search_path = public as $$
  select valor from public.configuracoes where chave = p_chave
$$;

create or replace function public.config_num(p_chave text, p_campo text, p_padrao numeric default 0) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce((select (valor ->> p_campo)::numeric from public.configuracoes where chave = p_chave), p_padrao)
$$;

-- Verdadeiro quando o comando veio do cliente (PostgREST), e não de uma função
-- SECURITY DEFINER do próprio banco nem do service_role das Edge Functions.
create or replace function public.eh_cliente() returns boolean
language sql stable as $$
  select current_user in ('authenticated', 'anon')
$$;

-- ---------------------------------------------------------------- papéis e permissões
create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin' and excluido_em is null)
$$;

create or replace function public.membro_ativo(p_id uuid default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = coalesce(p_id, auth.uid())
      and p.excluido_em is null
      and (p.papel = 'admin'
           or (p.status_assinatura = 'ativo' and (p.assinatura_valida_ate is null or p.assinatura_valida_ate >= now())))
  )
$$;

-- Ler conteúdo da comunidade: só membros com assinatura ativa (e admins)
create or replace function public.pode_ler() returns boolean
language sql stable security definer set search_path = public as $$
  select public.membro_ativo()
$$;

-- Escrever: membro ativo, não suspenso e que aceitou o Código de Conduta
create or replace function public.pode_escrever() returns boolean
language sql stable security definer set search_path = public as $$
  select public.membro_ativo() and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.suspenso_ate is null or p.suspenso_ate < now())
      and p.aceitou_codigo_conduta_em is not null
  )
$$;

create or replace function public.meu_nivel() returns smallint
language sql stable security definer set search_path = public as $$
  select coalesce((select nivel from public.profiles where id = auth.uid()), 0)::smallint
$$;

-- Permissão por reputação. Admins têm todas as permissões de nível.
create or replace function public.tem_nivel(p_nivel smallint) returns boolean
language sql stable security definer set search_path = public as $$
  select public.pode_escrever() and (public.eh_admin() or public.meu_nivel() >= p_nivel)
$$;
create or replace function public.tem_nivel(p_nivel integer) returns boolean
language sql stable security definer set search_path = public as $$
  select public.tem_nivel(p_nivel::smallint)
$$;

create or replace function public.eh_moderador() returns boolean
language sql stable security definer set search_path = public as $$
  select public.eh_admin() or public.tem_nivel(4)
$$;

create or replace function public.coordena_projeto(p_projeto uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.eh_admin() or exists (
    select 1 from public.projetos pr where pr.id = p_projeto and pr.coordenador_id = auth.uid()
  ) or exists (
    select 1 from public.projeto_membros pm
    where pm.projeto_id = p_projeto and pm.profile_id = auth.uid() and pm.papel = 'coordenador'
  )
$$;

create or replace function public.participa_projeto(p_projeto uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projeto_membros where projeto_id = p_projeto and profile_id = auth.uid())
$$;

create or replace function public.eh_autor_artigo(p_artigo uuid, p_profile uuid default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.artigo_autores
    where artigo_id = p_artigo and profile_id = coalesce(p_profile, auth.uid()) and papel in ('autor', 'coautor')
  )
$$;

create or replace function public.coordena_nucleo(p_nucleo uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.eh_admin() or exists (
    select 1 from public.nucleos n join public.profiles p on p.id = n.coordenador_id
    where n.id = p_nucleo and n.coordenador_id = auth.uid() and p.papel in ('coordenador', 'admin')
  )
$$;

-- ---------------------------------------------------------------- nome público (pseudônimo)
create or replace function public.nome_publico(p_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
           when p.excluido_em is not null then 'Membro removido'
           when p.pseudonimo_ativo then p.pseudonimo
           else p.nome_exibicao
         end
  from public.profiles p where p.id = p_id
$$;

-- Visão pública dos perfis: nunca expõe o nome real de quem usa pseudônimo.
-- A tabela profiles só é legível pelo próprio dono e por admins (RLS).
create or replace view public.perfis_publicos with (security_barrier = true) as
select
  p.id,
  case when p.excluido_em is not null then 'Membro removido'
       when p.pseudonimo_ativo then p.pseudonimo
       else p.nome_exibicao end as nome_publico,
  p.pseudonimo_ativo,
  case when p.excluido_em is null then p.avatar_url end as avatar_url,
  case when p.excluido_em is null then p.bio end as bio,
  case when p.excluido_em is null then p.cidade end as cidade,
  case when p.excluido_em is null then p.estado end as estado,
  p.nucleo_id,
  p.papel,
  p.nivel,
  p.reputacao_total,
  (p.excluido_em is not null) as removido,
  p.created_at
from public.profiles p
where public.pode_ler() or p.id = auth.uid();

-- ---------------------------------------------------------------- proteção de campos do perfil
create or replace function public.proteger_profile() returns trigger language plpgsql as $$
begin
  if not public.eh_cliente() then
    return new;
  end if;
  if new.id <> old.id
     or new.reputacao_total <> old.reputacao_total
     or new.nivel <> old.nivel
     or new.excluido_em is distinct from old.excluido_em then
    raise exception 'Campo do perfil não pode ser alterado pelo app' using errcode = '42501';
  end if;
  if not public.eh_admin() and (
       new.papel <> old.papel
       or new.status_assinatura <> old.status_assinatura
       or new.assinatura_valida_ate is distinct from old.assinatura_valida_ate
       or new.suspenso_ate is distinct from old.suspenso_ate) then
    raise exception 'Somente administradores alteram papel, assinatura e suspensão' using errcode = '42501';
  end if;
  -- o aceite do Código de Conduta só pode ser registrado, nunca "desfeito" pelo app
  if old.aceitou_codigo_conduta_em is not null and new.aceitou_codigo_conduta_em is null then
    new.aceitou_codigo_conduta_em := old.aceitou_codigo_conduta_em;
  end if;
  return new;
end $$;
create trigger profiles_proteger before update on public.profiles
  for each row execute function public.proteger_profile();

-- ---------------------------------------------------------------- perfil automático no cadastro
create or replace function public.criar_profile_novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome_exibicao, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''),
             nullif(new.raw_user_meta_data ->> 'name', ''),
             split_part(coalesce(new.email, 'membro'), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger auth_novo_usuario after insert on auth.users
  for each row execute function public.criar_profile_novo_usuario();

-- ---------------------------------------------------------------- rate limiting
-- Limite simples por janela de 1h, aplicado em triggers de INSERT.
create or replace function public.checar_limite_criacao() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_autor uuid;
  v_qtd integer;
  v_limite integer;
  v_coluna text := tg_argv[0];
  v_chave text := coalesce(tg_argv[1], 'conteudo_por_hora');
begin
  if current_user not in ('authenticated', 'anon') and auth.uid() is null then
    return new;  -- seed, service_role, jobs
  end if;
  v_autor := (to_jsonb(new) ->> v_coluna)::uuid;
  if v_autor is null then return new; end if;
  v_limite := public.config_num('limites', v_chave, 30)::integer;
  execute format('select count(*) from public.%I where %I = $1 and created_at > now() - interval ''1 hour''',
                 tg_table_name, v_coluna) into v_qtd using v_autor;
  if v_qtd >= v_limite then
    raise exception 'Limite de % por hora atingido. Respire e tente mais tarde.', v_limite using errcode = 'P0429';
  end if;
  return new;
end $$;

create trigger topicos_limite before insert on public.topicos for each row execute function public.checar_limite_criacao('autor_id');
create trigger respostas_limite before insert on public.respostas for each row execute function public.checar_limite_criacao('autor_id');
create trigger artigos_limite before insert on public.artigos for each row execute function public.checar_limite_criacao('criado_por');
create trigger propostas_limite before insert on public.propostas for each row execute function public.checar_limite_criacao('autor_id');
create trigger comentarios_limite before insert on public.proposta_comentarios for each row execute function public.checar_limite_criacao('autor_id');
create trigger denuncias_limite before insert on public.denuncias for each row execute function public.checar_limite_criacao('denunciante_id', 'denuncias_por_hora');
create trigger doacoes_limite before insert on public.doacoes for each row execute function public.checar_limite_criacao('doador_id', 'doacoes_por_hora');
