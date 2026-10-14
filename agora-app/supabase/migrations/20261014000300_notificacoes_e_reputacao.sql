-- ============================================================================
-- Ágora · 003 · Notificações e reputação (pontos, níveis)
-- Toda pontuação nasce aqui, dentro do banco: nunca no cliente.
-- ============================================================================

-- ---------------------------------------------------------------- notificar
-- Respeita as preferências por tipo (profiles.preferencias_notificacao = {"tipo": false})
-- e deduplica por chave_unica. Nunca existe notificação de "atividade popular".
create or replace function public.notificar(
  p_profile uuid, p_tipo text, p_titulo text, p_corpo text default null,
  p_link text default null, p_chave text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_pref jsonb;
begin
  if p_profile is null then return; end if;
  select preferencias_notificacao into v_pref from public.profiles where id = p_profile and excluido_em is null;
  if not found then return; end if;
  if p_tipo <> 'moderacao' and coalesce((v_pref ->> p_tipo)::boolean, true) = false then
    return;
  end if;
  insert into public.notificacoes (profile_id, tipo, titulo, corpo, link, chave_unica)
  values (p_profile, p_tipo, p_titulo, p_corpo, p_link, p_chave)
  on conflict do nothing;
end $$;
revoke execute on function public.notificar(uuid, text, text, text, text, text) from public, anon, authenticated;

-- Cliente só pode marcar como lida
create or replace function public.proteger_notificacao() returns trigger language plpgsql as $$
begin
  if public.eh_cliente() then
    if new.profile_id <> old.profile_id or new.tipo <> old.tipo or new.titulo <> old.titulo
       or new.corpo is distinct from old.corpo or new.link is distinct from old.link
       or new.push_enviado_em is distinct from old.push_enviado_em then
      raise exception 'Somente o campo "lida" pode ser alterado' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger notificacoes_proteger before update on public.notificacoes
  for each row execute function public.proteger_notificacao();

-- ---------------------------------------------------------------- nível a partir dos pontos
create or replace function public.nivel_para_pontos(p_pontos integer) returns smallint
language sql stable security definer set search_path = public as $$
  select coalesce(max(n::smallint), 1::smallint)
  from jsonb_each_text(coalesce(public.config('niveis'), '{"1":0}'::jsonb)) as t(n, minimo)
  where p_pontos >= minimo::integer
$$;

create or replace function public.nome_nivel(p_nivel smallint) returns text language sql immutable as $$
  select case p_nivel when 1 then 'Aprendiz' when 2 then 'Colaborador' when 3 then 'Curador' when 4 then 'Guardião' else 'Aprendiz' end
$$;

create or replace function public.recalcular_reputacao(p_profile uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_total integer;
  v_nivel smallint;
  v_antigo smallint;
begin
  select coalesce(sum(pontos), 0) into v_total from public.reputacao_eventos where profile_id = p_profile;
  v_nivel := public.nivel_para_pontos(greatest(v_total, 0));
  select nivel into v_antigo from public.profiles where id = p_profile;
  update public.profiles set reputacao_total = v_total, nivel = v_nivel where id = p_profile;
  if v_nivel > coalesce(v_antigo, 1) then
    perform public.notificar(p_profile, 'nivel_subiu',
      'Você agora é ' || public.nome_nivel(v_nivel) || '!',
      'Suas contribuições abriram novas possibilidades na Ágora.',
      '/perfil', 'nivel:' || v_nivel);
  end if;
end $$;
revoke execute on function public.recalcular_reputacao(uuid) from public, anon, authenticated;

create or replace function public.reputacao_apos_evento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.recalcular_reputacao(new.profile_id);
  return new;
end $$;
create trigger reputacao_eventos_recalcular after insert on public.reputacao_eventos
  for each row execute function public.reputacao_apos_evento();

-- Eventos de reputação são um livro-razão: só se acrescenta.
create or replace function public.bloquear_alteracao() returns trigger language plpgsql as $$
begin
  raise exception 'Registro imutável (%): correções só por novo lançamento', tg_table_name using errcode = '42501';
end $$;
create trigger reputacao_eventos_imutavel before update or delete on public.reputacao_eventos
  for each row execute function public.bloquear_alteracao();

-- ---------------------------------------------------------------- registrar pontos
-- Pontos vêm de configuracoes.pontos[acao] × multiplicador. Ações "únicas" por
-- referência não pontuam duas vezes (a menos que tenham sido estornadas).
create or replace function public.ja_pontuado(p_profile uuid, p_acao text, p_ref uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.reputacao_eventos where profile_id = p_profile and acao = p_acao and referencia_id = p_ref)
       > (select count(*) from public.reputacao_eventos where profile_id = p_profile and acao = p_acao || '_estorno' and referencia_id = p_ref)
$$;

create or replace function public.registrar_reputacao(
  p_profile uuid, p_acao text, p_ref_tipo text, p_ref_id uuid,
  p_multiplicador numeric default 1, p_unico boolean default true
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_base numeric;
  v_pontos integer;
begin
  if p_profile is null then return; end if;
  if p_unico and public.ja_pontuado(p_profile, p_acao, p_ref_id) then return; end if;
  v_base := public.config_num('pontos', p_acao, 0);
  v_pontos := round(v_base * p_multiplicador)::integer;
  if v_pontos = 0 then return; end if;
  insert into public.reputacao_eventos (profile_id, acao, pontos, referencia_tipo, referencia_id)
  values (p_profile, p_acao, v_pontos, p_ref_tipo, p_ref_id);
end $$;
revoke execute on function public.registrar_reputacao(uuid, text, text, uuid, numeric, boolean) from public, anon, authenticated;

-- Estorno: devolve exatamente os pontos do último lançamento da ação
create or replace function public.estornar_reputacao(p_profile uuid, p_acao text, p_ref_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_pontos integer;
begin
  if not public.ja_pontuado(p_profile, p_acao, p_ref_id) then return; end if;
  select pontos into v_pontos from public.reputacao_eventos
   where profile_id = p_profile and acao = p_acao and referencia_id = p_ref_id
   order by criado_em desc limit 1;
  insert into public.reputacao_eventos (profile_id, acao, pontos, referencia_tipo, referencia_id)
  values (p_profile, p_acao || '_estorno', -v_pontos, 'estorno', p_ref_id);
end $$;
revoke execute on function public.estornar_reputacao(uuid, text, uuid) from public, anon, authenticated;

-- Histórico de reputação de um membro (visão de perfil, sem ranking)
create or replace function public.historico_reputacao(p_profile uuid, p_limite integer default 50, p_antes timestamptz default null)
returns table (id uuid, acao text, pontos integer, referencia_tipo text, referencia_id uuid, criado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.acao, r.pontos, r.referencia_tipo, r.referencia_id, r.criado_em
  from public.reputacao_eventos r
  where r.profile_id = p_profile
    and (public.pode_ler() or p_profile = auth.uid())
    and (p_antes is null or r.criado_em < p_antes)
  order by r.criado_em desc
  limit least(p_limite, 200)
$$;
