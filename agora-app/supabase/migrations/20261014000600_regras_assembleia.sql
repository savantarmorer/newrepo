-- ============================================================================
-- Ágora · 006 · Assembleia comunitária (off-chain): ciclo, votos, apuração
-- 1 pessoa = 1 voto. Reputação só define quem pode propor.
-- ============================================================================

create or replace function public.validar_proposta() returns trigger language plpgsql as $$
declare
  v_cfg jsonb := public.config('assembleia');
  v_debate_min interval := make_interval(days => coalesce((v_cfg ->> 'debate_min_dias')::int, 5));
  v_votacao_min interval := make_interval(days => coalesce((v_cfg ->> 'votacao_min_dias')::int, 3));
begin
  if not public.eh_cliente() then return new; end if;
  if tg_op = 'INSERT' then
    new.autor_id := auth.uid();
    new.rodada := 1; new.membros_aptos := null; new.lembrete_24h_enviado := false;
    new.oculto := false; new.excluido_em := null;
    if new.status not in ('rascunho', 'debate') then new.status := 'rascunho'; end if;
    new.quorum_minimo := coalesce((v_cfg ->> 'quorum_padrao')::numeric, 0.10);
    new.limiar_aprovacao := case when new.tipo in ('financeira', 'regimento')
                                 then coalesce((v_cfg ->> 'limiar_qualificado')::numeric, 0.6667)
                                 else coalesce((v_cfg ->> 'limiar_padrao')::numeric, 0.60) end;
    if new.tipo = 'nucleo' and not exists (
         select 1 from public.profiles where id = auth.uid() and (nucleo_id = new.escopo_nucleo_id or papel = 'admin')) then
      raise exception 'Propostas de núcleo são abertas por membros daquele núcleo';
    end if;
  else
    if old.autor_id <> auth.uid() then raise exception 'Só o autor altera a proposta' using errcode = '42501'; end if;
    if new.autor_id <> old.autor_id or new.rodada <> old.rodada or new.membros_aptos is distinct from old.membros_aptos
       or new.quorum_minimo <> old.quorum_minimo or new.oculto <> old.oculto
       or new.tipo <> old.tipo or new.escopo_nucleo_id is distinct from old.escopo_nucleo_id
       or new.natureza <> old.natureza then
      raise exception 'Alteração não permitida' using errcode = '42501';
    end if;
    new.limiar_aprovacao := old.limiar_aprovacao;
    if old.status not in ('rascunho', 'debate') then
      raise exception 'A proposta não pode mais ser alterada' using errcode = '42501';
    end if;
    if old.status = 'debate' and (new.votacao_ate is distinct from old.votacao_ate or new.debate_ate is distinct from old.debate_ate)
       and new.status = 'debate' then
      raise exception 'Prazos ficam fixos depois que o debate começa';
    end if;
    if new.status <> old.status and not (
         (old.status = 'rascunho' and new.status in ('debate', 'retirada'))
      or (old.status = 'debate' and new.status = 'retirada')) then
      raise exception 'Transição de status inválida (% → %)', old.status, new.status using errcode = '42501';
    end if;
  end if;
  if new.status = 'debate' and (tg_op = 'INSERT' or old.status = 'rascunho') then
    if length(trim(new.proposta_md)) < 50 then raise exception 'Escreva o texto da proposta (mínimo de 50 caracteres)'; end if;
    new.debate_iniciado_em := now();
    if new.debate_ate is null or new.debate_ate < now() + v_debate_min - interval '1 minute' then
      raise exception 'O debate precisa durar no mínimo % dias', extract(day from v_debate_min);
    end if;
    if new.votacao_ate is null or new.votacao_ate < new.debate_ate + v_votacao_min - interval '1 minute' then
      raise exception 'A votação precisa durar no mínimo % dias', extract(day from v_votacao_min);
    end if;
  end if;
  return new;
end $$;
create trigger propostas_validar before insert or update on public.propostas
  for each row execute function public.validar_proposta();

create or replace function public.validar_comentario_proposta() returns trigger language plpgsql as $$
declare v_status public.status_proposta;
begin
  if not public.eh_cliente() then return new; end if;
  if tg_op = 'INSERT' then
    select status into v_status from public.propostas where id = new.proposta_id;
    if v_status not in ('debate', 'votacao') then raise exception 'Comentários abertos só durante debate e votação'; end if;
    new.autor_id := auth.uid(); new.oculto := false; new.editado_em := null;
    return new;
  end if;
  if new.autor_id <> old.autor_id or new.proposta_id <> old.proposta_id or new.oculto <> old.oculto then
    raise exception 'Alteração não permitida' using errcode = '42501';
  end if;
  if old.autor_id <> auth.uid() then raise exception 'Só o autor edita o comentário' using errcode = '42501'; end if;
  if new.corpo_md <> old.corpo_md then new.editado_em := now(); end if;
  return new;
end $$;
create trigger proposta_comentarios_validar before insert or update on public.proposta_comentarios
  for each row execute function public.validar_comentario_proposta();

-- Pode votar na proposta? (membro ativo, não suspenso, do escopo)
create or replace function public.pode_votar(p_proposta uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.pode_escrever() and exists (
    select 1 from public.propostas pr
    where pr.id = p_proposta and pr.natureza = 'comunitaria'
      and (pr.escopo_nucleo_id is null
           or exists (select 1 from public.profiles p where p.id = auth.uid() and p.nucleo_id = pr.escopo_nucleo_id))
  )
$$;

create or replace function public.validar_voto() returns trigger language plpgsql as $$
declare v_prop record;
begin
  if not public.eh_cliente() then return new; end if;
  select status, votacao_ate, rodada into v_prop from public.propostas where id = new.proposta_id;
  if v_prop.status is distinct from 'votacao' or v_prop.votacao_ate <= now() then
    raise exception 'A votação desta proposta não está aberta';
  end if;
  if not public.pode_votar(new.proposta_id) then
    raise exception 'Você não está no escopo desta votação' using errcode = '42501';
  end if;
  new.profile_id := auth.uid();
  new.peso := 1;
  new.rodada := v_prop.rodada;
  if new.voto <> 'bloqueio' and new.voto <> 'contra' then
    new.justificativa := nullif(trim(coalesce(new.justificativa, '')), '');
  end if;
  return new;
end $$;
create trigger votos_validar before insert or update on public.votos
  for each row execute function public.validar_voto();
create trigger votos_sem_exclusao before delete on public.votos
  for each row execute function public.bloquear_alteracao();

-- Membros aptos no escopo (base do quórum)
create or replace function public.membros_aptos_escopo(p_nucleo uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.profiles p
  where p.excluido_em is null
    and p.status_assinatura = 'ativo'
    and (p.assinatura_valida_ate is null or p.assinatura_valida_ate >= now())
    and (p_nucleo is null or p.nucleo_id = p_nucleo)
$$;

-- Placar parcial: durante a votação só mostra a participação, não o voto de cada um
create or replace function public.placar_proposta(p_proposta uuid)
returns table (rodada integer, total integer, favor integer, contra integer, abstencao integer, bloqueio integer, quorum_exigido integer, encerrada boolean)
language plpgsql stable security definer set search_path = public as $$
declare v_prop record;
begin
  if not public.pode_ler() then return; end if;
  select * into v_prop from public.propostas where id = p_proposta;
  if v_prop is null then return; end if;
  rodada := v_prop.rodada;
  encerrada := v_prop.status in ('aprovada', 'rejeitada');
  quorum_exigido := greatest(1, ceil(v_prop.quorum_minimo * coalesce(v_prop.membros_aptos, public.membros_aptos_escopo(v_prop.escopo_nucleo_id))))::integer;
  select count(*), count(*) filter (where voto = 'favor'), count(*) filter (where voto = 'contra'),
         count(*) filter (where voto = 'abstencao'), count(*) filter (where voto = 'bloqueio')
    into total, favor, contra, abstencao, bloqueio
    from public.votos v where v.proposta_id = p_proposta and v.rodada = v_prop.rodada;
  if not encerrada then
    -- votos em aberto: só a contagem total e os bloqueios (que são públicos e em destaque)
    favor := null; contra := null; abstencao := null;
  end if;
  return next;
end $$;

-- Apuração de uma proposta cuja votação terminou
create or replace function public.apurar_proposta(p_proposta uuid) returns public.resultado_decisao
language plpgsql security definer set search_path = public as $$
declare
  v_prop record;
  v_cfg jsonb := public.config('assembleia');
  v_max_bloq integer := coalesce((v_cfg ->> 'bloqueios_maximos')::int, 3);
  v_total integer; v_favor integer; v_contra integer; v_abst integer; v_bloq integer;
  v_validos integer; v_quorum integer; v_quorum_ok boolean;
  v_resultado public.resultado_decisao;
  v_resumo text;
  v_votante uuid;
begin
  select * into v_prop from public.propostas where id = p_proposta for update;
  if v_prop.status <> 'votacao' then raise exception 'Proposta não está em votação'; end if;

  select count(*), count(*) filter (where voto = 'favor'), count(*) filter (where voto = 'contra'),
         count(*) filter (where voto = 'abstencao'), count(*) filter (where voto = 'bloqueio')
    into v_total, v_favor, v_contra, v_abst, v_bloq
    from public.votos where proposta_id = p_proposta and rodada = v_prop.rodada;

  v_validos := v_favor + v_contra + v_bloq;
  v_quorum := greatest(1, ceil(v_prop.quorum_minimo * coalesce(v_prop.membros_aptos, 0)))::integer;
  v_quorum_ok := v_total >= v_quorum;

  if v_bloq >= v_max_bloq then
    v_resultado := 'bloqueada';
    v_resumo := format('Proposta **bloqueada** na rodada %s por %s bloqueios fundamentados. Volta ao debate com novo prazo.',
                       v_prop.rodada, v_bloq);
  elsif v_quorum_ok and v_validos > 0 and (v_favor::numeric / v_validos) >= v_prop.limiar_aprovacao then
    v_resultado := 'aprovada';
    v_resumo := format('Proposta **aprovada** com %s%% dos votos válidos (limiar de %s%%).',
                       round(100.0 * v_favor / v_validos, 1), round(100 * v_prop.limiar_aprovacao, 1));
  else
    v_resultado := 'rejeitada';
    v_resumo := case when not v_quorum_ok
      then format('Proposta **rejeitada**: o quórum mínimo de %s votos não foi atingido (%s votaram).', v_quorum, v_total)
      else format('Proposta **rejeitada**: %s%% dos votos válidos foram favoráveis (limiar de %s%%).',
                  case when v_validos = 0 then 0 else round(100.0 * v_favor / v_validos, 1) end, round(100 * v_prop.limiar_aprovacao, 1)) end;
  end if;

  insert into public.decisoes (proposta_id, rodada, resultado, resumo_md, total_votos, votos_favor, votos_contra,
                               abstencoes, bloqueios, quorum_exigido, quorum_atingido)
  values (p_proposta, v_prop.rodada, v_resultado, v_resumo, v_total, v_favor, v_contra, v_abst, v_bloq, v_quorum, v_quorum_ok);

  if v_resultado = 'bloqueada' then
    update public.propostas
       set status = 'debate', rodada = rodada + 1, debate_iniciado_em = now(),
           debate_ate = now() + make_interval(days => coalesce((v_cfg ->> 'debate_min_dias')::int, 5)),
           votacao_ate = now() + make_interval(days => coalesce((v_cfg ->> 'debate_min_dias')::int, 5)
                                                     + coalesce((v_cfg ->> 'votacao_min_dias')::int, 3)),
           membros_aptos = null, lembrete_24h_enviado = false
     where id = p_proposta;
  else
    update public.propostas set status = v_resultado::text::public.status_proposta where id = p_proposta;
    if v_resultado = 'aprovada' then
      perform public.registrar_reputacao(v_prop.autor_id, 'proposta_aprovada', 'proposta', p_proposta);
    end if;
  end if;

  perform public.notificar(v_prop.autor_id, 'proposta_resultado', 'Resultado: ' || left(v_prop.titulo, 60),
    regexp_replace(v_resumo, '\*\*', '', 'g'), '/assembleia/proposta/' || p_proposta, 'resultado:' || p_proposta || ':' || v_prop.rodada);
  for v_votante in select profile_id from public.votos where proposta_id = p_proposta and rodada = v_prop.rodada and profile_id <> v_prop.autor_id loop
    perform public.notificar(v_votante, 'proposta_resultado', 'Resultado: ' || left(v_prop.titulo, 60),
      regexp_replace(v_resumo, '\*\*', '', 'g'), '/assembleia/proposta/' || p_proposta, 'resultado:' || p_proposta || ':' || v_prop.rodada);
  end loop;
  return v_resultado;
end $$;
revoke execute on function public.apurar_proposta(uuid) from public, anon, authenticated;

-- Decisões são imutáveis
create trigger decisoes_imutavel before update or delete on public.decisoes
  for each row execute function public.bloquear_alteracao();

-- ---------------------------------------------------------------- função agendada (cron)
create or replace function public.assembleia_tick() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v record;
  v_membro uuid;
  v_abertas integer := 0;
  v_apuradas integer := 0;
  v_lembretes integer := 0;
begin
  -- debate → votação
  for v in select * from public.propostas where status = 'debate' and natureza = 'comunitaria' and debate_ate <= now() for update skip locked loop
    update public.propostas set status = 'votacao', membros_aptos = public.membros_aptos_escopo(v.escopo_nucleo_id) where id = v.id;
    for v_membro in
      select p.id from public.profiles p
      where p.excluido_em is null and p.status_assinatura = 'ativo'
        and (v.escopo_nucleo_id is null or p.nucleo_id = v.escopo_nucleo_id)
    loop
      perform public.notificar(v_membro, 'proposta_votacao', 'Em votação: ' || left(v.titulo, 60),
        'A votação fica aberta até ' || to_char(v.votacao_ate at time zone 'America/Sao_Paulo', 'DD/MM "às" HH24:MI') || '.',
        '/assembleia/proposta/' || v.id, 'votacao:' || v.id || ':' || v.rodada);
    end loop;
    v_abertas := v_abertas + 1;
  end loop;

  -- votação encerrada → apuração
  for v in select id from public.propostas where status = 'votacao' and natureza = 'comunitaria' and votacao_ate <= now() for update skip locked loop
    perform public.apurar_proposta(v.id);
    v_apuradas := v_apuradas + 1;
  end loop;

  -- lembrete: votação termina em 24h e você não votou
  for v in select * from public.propostas where status = 'votacao' and natureza = 'comunitaria' and not lembrete_24h_enviado
             and votacao_ate <= now() + interval '24 hours' for update skip locked loop
    for v_membro in
      select p.id from public.profiles p
      where p.excluido_em is null and p.status_assinatura = 'ativo'
        and (v.escopo_nucleo_id is null or p.nucleo_id = v.escopo_nucleo_id)
        and not exists (select 1 from public.votos vt where vt.proposta_id = v.id and vt.rodada = v.rodada and vt.profile_id = p.id)
    loop
      perform public.notificar(v_membro, 'votacao_24h', 'Votação termina em 24h',
        'Você ainda não votou em "' || left(v.titulo, 60) || '".', '/assembleia/proposta/' || v.id,
        'lembrete:' || v.id || ':' || v.rodada);
      v_lembretes := v_lembretes + 1;
    end loop;
    update public.propostas set lembrete_24h_enviado = true where id = v.id;
  end loop;

  return jsonb_build_object('abertas', v_abertas, 'apuradas', v_apuradas, 'lembretes', v_lembretes);
end $$;
revoke execute on function public.assembleia_tick() from public, anon, authenticated;

-- Lembrete de evento em 24h (para quem marcou "vou" ou "talvez")
create or replace function public.eventos_tick() returns integer
language plpgsql security definer set search_path = public as $$
declare
  v record;
  v_qtd integer := 0;
begin
  for v in
    select e.id, e.titulo, e.inicio, r.profile_id from public.eventos e
    join public.rsvps r on r.evento_id = e.id and r.status in ('vou', 'talvez')
    where e.excluido_em is null and e.inicio between now() and now() + interval '24 hours'
  loop
    perform public.notificar(v.profile_id, 'evento_24h', 'Amanhã: ' || left(v.titulo, 60),
      'Começa ' || to_char(v.inicio at time zone 'America/Sao_Paulo', 'DD/MM "às" HH24:MI') || '.',
      '/mutirao/evento/' || v.id, 'evento24:' || v.id);
    v_qtd := v_qtd + 1;
  end loop;
  return v_qtd;
end $$;
revoke execute on function public.eventos_tick() from public, anon, authenticated;
