-- ============================================================================
-- Ágora · 007 · Moderação transparente, busca full-text, LGPD e painel admin
-- ============================================================================

-- ---------------------------------------------------------------- denúncias
create or replace function public.validar_denuncia() returns trigger language plpgsql as $$
begin
  if not public.eh_cliente() then return new; end if;
  if tg_op = 'INSERT' then
    new.denunciante_id := auth.uid();
    new.status := 'aberta'; new.resolvida_por := null; new.resolucao := null; new.resolvida_em := null;
    return new;
  end if;
  raise exception 'Denúncias são resolvidas pela moderação' using errcode = '42501';
end $$;
create trigger denuncias_validar before insert or update on public.denuncias
  for each row execute function public.validar_denuncia();

create trigger log_moderacao_imutavel before update or delete on public.log_moderacao
  for each row execute function public.bloquear_alteracao();

-- Autor de qualquer item moderável
create or replace function public.autor_do_item(p_tipo public.tipo_item_moderavel, p_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select case p_tipo
    when 'topico' then (select autor_id from public.topicos where id = p_id)
    when 'resposta' then (select autor_id from public.respostas where id = p_id)
    when 'artigo' then (select criado_por from public.artigos where id = p_id)
    when 'proposta' then (select autor_id from public.propostas where id = p_id)
    when 'proposta_comentario' then (select autor_id from public.proposta_comentarios where id = p_id)
    when 'projeto' then (select coordenador_id from public.projetos where id = p_id)
    when 'evento' then (select criado_por from public.eventos where id = p_id)
    when 'perfil' then p_id
  end
$$;

-- Oculta: o texto original vai para conteudo_oculto (só admins leem) e o item
-- passa a exibir "conteúdo removido pela moderação".
create or replace function public.ocultar_item(p_tipo public.tipo_item_moderavel, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_titulo text; v_corpo text;
begin
  case p_tipo
    when 'topico' then
      select titulo, corpo_md into v_titulo, v_corpo from public.topicos where id = p_id;
      update public.topicos set oculto = true, titulo = '[removido pela moderação]', corpo_md = '' where id = p_id;
    when 'resposta' then
      select corpo_md into v_corpo from public.respostas where id = p_id;
      update public.respostas set oculto = true, corpo_md = '' where id = p_id;
    when 'artigo' then
      select titulo, corpo_md into v_titulo, v_corpo from public.artigos where id = p_id;
      update public.artigos set oculto = true, titulo = '[removido pela moderação]', corpo_md = '', resumo = null where id = p_id;
    when 'proposta' then
      select titulo, proposta_md into v_titulo, v_corpo from public.propostas where id = p_id;
      update public.propostas set oculto = true, titulo = '[removido pela moderação]', contexto_md = '', proposta_md = '' where id = p_id;
    when 'proposta_comentario' then
      select corpo_md into v_corpo from public.proposta_comentarios where id = p_id;
      update public.proposta_comentarios set oculto = true, corpo_md = '' where id = p_id;
    when 'projeto' then
      select titulo, descricao_md into v_titulo, v_corpo from public.projetos where id = p_id;
      update public.projetos set oculto = true, descricao_md = '' where id = p_id;
    when 'evento' then
      select titulo, descricao into v_titulo, v_corpo from public.eventos where id = p_id;
      update public.eventos set descricao = '[removido pela moderação]' where id = p_id;
    when 'perfil' then
      select nome_exibicao, bio into v_titulo, v_corpo from public.profiles where id = p_id;
      update public.profiles set bio = null, avatar_url = null where id = p_id;
  end case;
  insert into public.conteudo_oculto (item_tipo, item_id, titulo_original, corpo_original, ocultado_por)
  values (p_tipo, p_id, v_titulo, v_corpo, auth.uid())
  on conflict (item_tipo, item_id) do nothing;
end $$;
revoke execute on function public.ocultar_item(public.tipo_item_moderavel, uuid) from public, anon, authenticated;

create or replace function public.moderar_item(
  p_tipo public.tipo_item_moderavel, p_id uuid, p_acao public.acao_moderacao, p_motivo text, p_dias integer default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_autor uuid := public.autor_do_item(p_tipo, p_id);
  v_dias integer := coalesce(p_dias, public.config_num('moderacao', 'dias_suspensao_padrao', 7)::integer);
  v_original record;
begin
  if not public.eh_moderador() then raise exception 'Ação restrita à moderação' using errcode = '42501'; end if;
  if length(trim(coalesce(p_motivo, ''))) < 10 then raise exception 'Descreva o motivo (mínimo de 10 caracteres)'; end if;
  if v_autor = auth.uid() then raise exception 'Ninguém modera o próprio conteúdo' using errcode = '42501'; end if;
  if v_autor is null then raise exception 'Item não encontrado'; end if;

  if p_acao = 'ocultar' then
    perform public.ocultar_item(p_tipo, p_id);
    perform public.registrar_reputacao(v_autor, 'conteudo_removido', p_tipo::text, p_id);
    perform public.notificar(v_autor, 'moderacao', 'Um conteúdo seu foi removido pela moderação', p_motivo, '/perfil/moderacao');
  elsif p_acao = 'advertir' then
    perform public.notificar(v_autor, 'moderacao', 'Advertência da moderação', p_motivo, '/perfil/moderacao');
  elsif p_acao = 'suspender' then
    update public.profiles set suspenso_ate = now() + make_interval(days => v_dias) where id = v_autor;
    perform public.notificar(v_autor, 'moderacao', 'Sua participação foi suspensa por ' || v_dias || ' dias',
      p_motivo || ' Você continua podendo ler.', '/perfil/moderacao');
  elsif p_acao = 'restaurar' then
    if not public.eh_admin() then raise exception 'Só admins restauram conteúdo (recurso)' using errcode = '42501'; end if;
    select * into v_original from public.conteudo_oculto where item_tipo = p_tipo and item_id = p_id;
    if v_original is null then raise exception 'Nada a restaurar'; end if;
    case p_tipo
      when 'topico' then update public.topicos set oculto = false, titulo = v_original.titulo_original, corpo_md = coalesce(v_original.corpo_original, '') where id = p_id;
      when 'resposta' then update public.respostas set oculto = false, corpo_md = coalesce(v_original.corpo_original, '') where id = p_id;
      when 'artigo' then update public.artigos set oculto = false, titulo = v_original.titulo_original, corpo_md = coalesce(v_original.corpo_original, '') where id = p_id;
      when 'proposta' then update public.propostas set oculto = false, titulo = v_original.titulo_original, proposta_md = coalesce(v_original.corpo_original, '') where id = p_id;
      when 'proposta_comentario' then update public.proposta_comentarios set oculto = false, corpo_md = coalesce(v_original.corpo_original, '') where id = p_id;
      when 'projeto' then update public.projetos set oculto = false, descricao_md = coalesce(v_original.corpo_original, '') where id = p_id;
      when 'evento' then update public.eventos set descricao = v_original.corpo_original where id = p_id;
      when 'perfil' then update public.profiles set bio = v_original.corpo_original where id = p_id;
    end case;
    delete from public.conteudo_oculto where item_tipo = p_tipo and item_id = p_id;
    perform public.estornar_reputacao(v_autor, 'conteudo_removido', p_id);
  end if;

  insert into public.log_moderacao (moderador_id, acao, item_tipo, item_id, motivo)
  values (auth.uid(), p_acao, p_tipo, p_id, p_motivo);
end $$;

create or replace function public.resolver_denuncia(
  p_denuncia uuid, p_acao public.acao_moderacao, p_motivo text, p_dias integer default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v record;
begin
  if not public.eh_moderador() then raise exception 'Ação restrita à moderação' using errcode = '42501'; end if;
  select * into v from public.denuncias where id = p_denuncia for update;
  if v is null or v.status <> 'aberta' then raise exception 'Denúncia já resolvida'; end if;
  if v.denunciante_id = auth.uid() then raise exception 'Quem denunciou não resolve a própria denúncia' using errcode = '42501'; end if;
  if p_acao in ('descartar', 'manter') then
    if length(trim(coalesce(p_motivo, ''))) < 10 then raise exception 'Descreva o motivo (mínimo de 10 caracteres)'; end if;
    insert into public.log_moderacao (moderador_id, acao, item_tipo, item_id, motivo)
    values (auth.uid(), p_acao, v.tipo_item, v.item_id, p_motivo);
  else
    perform public.moderar_item(v.tipo_item, v.item_id, p_acao, p_motivo, p_dias);
  end if;
  update public.denuncias
     set status = case when p_acao = 'descartar' then 'descartada'::public.status_denuncia else 'resolvida' end,
         resolvida_por = auth.uid(), resolucao = p_acao::text || ': ' || p_motivo, resolvida_em = now()
   where tipo_item = v.tipo_item and item_id = v.item_id and status = 'aberta';
end $$;

-- Log público: sem nomes de quem denunciou; com o item e o motivo
create or replace view public.log_moderacao_publico with (security_barrier = true) as
select l.id, l.acao, l.item_tipo, l.item_id, l.motivo, l.criado_em,
       public.nome_publico(l.moderador_id) as moderador_nome, l.moderador_id
from public.log_moderacao l
where public.pode_ler();

-- ---------------------------------------------------------------- busca full-text
create or replace function public.f_unaccent(text) returns text
language sql immutable parallel safe strict set search_path = public, extensions as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

create or replace function public.doc_busca(p_a text, p_b text default '', p_c text default '') returns tsvector
language sql immutable parallel safe as $$
  select setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(p_a, ''))), 'A')
      || setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(p_b, ''))), 'B')
      || setweight(to_tsvector('portuguese', public.f_unaccent(left(coalesce(p_c, ''), 200000))), 'C')
$$;

alter table public.topicos add column busca tsvector generated always as (public.doc_busca(titulo, corpo_md)) stored;
alter table public.artigos add column busca tsvector generated always as (public.doc_busca(titulo, resumo, corpo_md)) stored;
alter table public.trilhas add column busca tsvector generated always as (public.doc_busca(titulo, descricao)) stored;
alter table public.projetos add column busca tsvector generated always as (public.doc_busca(titulo, causa, descricao_md)) stored;
alter table public.propostas add column busca tsvector generated always as (public.doc_busca(titulo, contexto_md, proposta_md)) stored;
alter table public.decisoes add column busca tsvector generated always as (public.doc_busca(resumo_md)) stored;
create index topicos_busca_idx on public.topicos using gin (busca);
create index artigos_busca_idx on public.artigos using gin (busca);
create index trilhas_busca_idx on public.trilhas using gin (busca);
create index projetos_busca_idx on public.projetos using gin (busca);
create index propostas_busca_idx on public.propostas using gin (busca);
create index decisoes_busca_idx on public.decisoes using gin (busca);

-- Busca global (SECURITY INVOKER: as políticas RLS de cada tabela continuam valendo)
create or replace function public.buscar(p_termo text, p_limite integer default 8)
returns table (tipo text, id uuid, titulo text, trecho text, rank real, data timestamptz)
language sql stable as $$
  with q as (select websearch_to_tsquery('portuguese', public.f_unaccent(p_termo)) as tsq),
  lim as (select least(greatest(p_limite, 1), 30) as n)
  (select 'topico', t.id, t.titulo, ts_headline('portuguese', left(t.corpo_md, 3000), q.tsq, 'MaxWords=24,MinWords=8,StartSel=«,StopSel=»'),
          ts_rank(t.busca, q.tsq), t.created_at
     from public.topicos t, q where t.busca @@ q.tsq and t.excluido_em is null and not t.oculto
     order by 5 desc limit (select n from lim))
  union all
  (select 'artigo', a.id, a.titulo, ts_headline('portuguese', coalesce(a.resumo, left(a.corpo_md, 3000)), q.tsq, 'MaxWords=24,MinWords=8,StartSel=«,StopSel=»'),
          ts_rank(a.busca, q.tsq), a.publicado_em
     from public.artigos a, q where a.busca @@ q.tsq and a.status = 'publicado' and a.excluido_em is null and not a.oculto
     order by 5 desc limit (select n from lim))
  union all
  (select 'trilha', tr.id, tr.titulo, ts_headline('portuguese', coalesce(tr.descricao, ''), q.tsq, 'MaxWords=24,MinWords=8,StartSel=«,StopSel=»'),
          ts_rank(tr.busca, q.tsq), tr.created_at
     from public.trilhas tr, q where tr.busca @@ q.tsq and tr.publicada and tr.excluido_em is null
     order by 5 desc limit (select n from lim))
  union all
  (select 'projeto', p.id, p.titulo, ts_headline('portuguese', left(p.descricao_md, 3000), q.tsq, 'MaxWords=24,MinWords=8,StartSel=«,StopSel=»'),
          ts_rank(p.busca, q.tsq), p.created_at
     from public.projetos p, q where p.busca @@ q.tsq and p.excluido_em is null and not p.oculto
     order by 5 desc limit (select n from lim))
  union all
  (select 'proposta', pr.id, pr.titulo, ts_headline('portuguese', left(pr.proposta_md, 3000), q.tsq, 'MaxWords=24,MinWords=8,StartSel=«,StopSel=»'),
          ts_rank(pr.busca, q.tsq), pr.created_at
     from public.propostas pr, q where pr.busca @@ q.tsq and pr.status <> 'rascunho' and pr.excluido_em is null and not pr.oculto
     order by 5 desc limit (select n from lim))
  union all
  (select 'decisao', d.id, (select titulo from public.propostas where id = d.proposta_id),
          ts_headline('portuguese', d.resumo_md, q.tsq, 'MaxWords=24,MinWords=8,StartSel=«,StopSel=»'),
          ts_rank(d.busca, q.tsq), d.registrada_em
     from public.decisoes d, q where d.busca @@ q.tsq
     order by 5 desc limit (select n from lim))
$$;

-- ---------------------------------------------------------------- LGPD: exportação
create or replace function public.exportar_meus_dados() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Não autenticado' using errcode = '42501'; end if;
  return jsonb_build_object(
    'gerado_em', now(),
    'aviso', 'Exportação dos seus dados pessoais e contribuições na Ágora (LGPD, art. 18).',
    'perfil', (select to_jsonb(p) - 'busca' from public.profiles p where id = v_uid),
    'topicos', coalesce((select jsonb_agg(to_jsonb(t) - 'busca') from public.topicos t where autor_id = v_uid), '[]'),
    'respostas', coalesce((select jsonb_agg(to_jsonb(r)) from public.respostas r where autor_id = v_uid), '[]'),
    'artigos', coalesce((select jsonb_agg(to_jsonb(a) - 'busca') from public.artigos a
                           join public.artigo_autores aa on aa.artigo_id = a.id and aa.profile_id = v_uid), '[]'),
    'revisoes', coalesce((select jsonb_agg(to_jsonb(r)) from public.revisoes r where revisor_id = v_uid), '[]'),
    'trilhas_curadas', coalesce((select jsonb_agg(to_jsonb(t) - 'busca') from public.trilhas t where curador_id = v_uid), '[]'),
    'progresso_trilhas', coalesce((select jsonb_agg(to_jsonb(p)) from public.progresso_trilha p where profile_id = v_uid), '[]'),
    'trilhas_concluidas', coalesce((select jsonb_agg(to_jsonb(t)) from public.trilhas_concluidas t where profile_id = v_uid), '[]'),
    'salvos', coalesce((select jsonb_agg(to_jsonb(s)) from public.salvos s where profile_id = v_uid), '[]'),
    'projetos', coalesce((select jsonb_agg(to_jsonb(pm)) from public.projeto_membros pm where profile_id = v_uid), '[]'),
    'horas_voluntariado', coalesce((select jsonb_agg(to_jsonb(h)) from public.horas_voluntariado h where profile_id = v_uid), '[]'),
    'rsvps', coalesce((select jsonb_agg(to_jsonb(r)) from public.rsvps r where profile_id = v_uid), '[]'),
    'doacoes_identificadas', coalesce((select jsonb_agg(to_jsonb(d)) from public.doacoes d where doador_id = v_uid), '[]'),
    'propostas', coalesce((select jsonb_agg(to_jsonb(p) - 'busca') from public.propostas p where autor_id = v_uid), '[]'),
    'comentarios_propostas', coalesce((select jsonb_agg(to_jsonb(c)) from public.proposta_comentarios c where autor_id = v_uid), '[]'),
    'votos', coalesce((select jsonb_agg(to_jsonb(v)) from public.votos v where profile_id = v_uid), '[]'),
    'reputacao', coalesce((select jsonb_agg(to_jsonb(r)) from public.reputacao_eventos r where profile_id = v_uid), '[]'),
    'notificacoes', coalesce((select jsonb_agg(to_jsonb(n)) from public.notificacoes n where profile_id = v_uid), '[]'),
    'denuncias_feitas', coalesce((select jsonb_agg(to_jsonb(d)) from public.denuncias d where denunciante_id = v_uid), '[]'),
    'carteira', (select to_jsonb(c) from public.carteiras c where profile_id = v_uid),
    'creditos_drc', coalesce((select jsonb_agg(to_jsonb(c)) from public.creditos_drc c where profile_id = v_uid), '[]')
  );
end $$;

-- ---------------------------------------------------------------- LGPD: exclusão de conta
-- Anonimiza o perfil e o conteúdo público; preserva votos e lançamentos de caixa,
-- que passam a aparecer como "Membro removido".
create or replace function public.anonimizar_conta(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set
    nome_exibicao = 'Membro removido', pseudonimo = null, pseudonimo_ativo = false, bio = null, avatar_url = null,
    cidade = null, estado = null, nucleo_id = null, interesses = '{}', status_assinatura = 'inativo',
    preferencias_notificacao = '{}', papel = 'membro', excluido_em = now()
  where id = p_uid;
  delete from public.salvos where profile_id = p_uid;
  delete from public.progresso_trilha where profile_id = p_uid;
  delete from public.notificacoes where profile_id = p_uid;
  delete from public.dispositivos_push where profile_id = p_uid;
  delete from public.projeto_membros where profile_id = p_uid and papel = 'voluntario';
  update public.tarefas set responsavel_id = null, status = case when status = 'fazendo' then 'a_fazer'::public.status_tarefa else status end
   where responsavel_id = p_uid;
  update public.rsvps set status = 'nao_vou' where profile_id = p_uid and status <> 'nao_vou'
     and evento_id in (select id from public.eventos where inicio > now());
  update public.nucleos set coordenador_id = null where coordenador_id = p_uid;
  update public.propostas set status = 'retirada' where autor_id = p_uid and status in ('rascunho', 'debate');
end $$;
revoke execute on function public.anonimizar_conta(uuid) from public, anon, authenticated;

create or replace function public.excluir_minha_conta() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Não autenticado' using errcode = '42501'; end if;
  perform public.anonimizar_conta(auth.uid());
end $$;

-- ---------------------------------------------------------------- painel admin: métricas
create or replace function public.metricas_admin() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eh_admin() then raise exception 'Restrito a administradores' using errcode = '42501'; end if;
  return jsonb_build_object(
    'membros_ativos', public.membros_aptos_escopo(null),
    'membros_total', (select count(*) from public.profiles where excluido_em is null),
    'artigos_publicados', (select count(*) from public.artigos where status = 'publicado' and not oculto),
    'artigos_em_revisao', (select count(*) from public.artigos where status = 'em_revisao'),
    'horas_confirmadas', (select coalesce(sum(horas), 0) from public.horas_voluntariado where confirmado_em is not null),
    'denuncias_abertas', (select count(*) from public.denuncias where status = 'aberta'),
    'propostas_em_votacao', (select count(*) from public.propostas where status = 'votacao'),
    'projetos', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'titulo', p.titulo, 'status', p.status,
                                          'arrecadado', r.total_entradas, 'gasto', r.total_saidas, 'saldo', r.saldo)
                       order by p.created_at desc)
      from public.projetos p join public.caixa_resumo r on r.projeto_id = p.id
      where p.excluido_em is null), '[]')
  );
end $$;
