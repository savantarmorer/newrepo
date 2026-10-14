-- ============================================================================
-- Ágora · 004 · Regras da Biblioteca (tópicos, respostas, artigos, revisões, trilhas)
-- Funções de validação são SECURITY INVOKER (enxergam quem chamou);
-- efeitos colaterais (pontos, notificações) são SECURITY DEFINER.
-- ============================================================================

-- ---------------------------------------------------------------- tópicos
create or replace function public.validar_topico() returns trigger language plpgsql as $$
begin
  if not public.eh_cliente() then return new; end if;
  if tg_op = 'INSERT' then
    new.autor_id := auth.uid();
    new.fixado := false; new.trancado := false; new.oculto := false;
    new.status := 'aberto'; new.editado_em := null; new.excluido_em := null;
    return new;
  end if;
  if new.autor_id <> old.autor_id or new.oculto <> old.oculto or new.created_at <> old.created_at then
    raise exception 'Alteração não permitida' using errcode = '42501';
  end if;
  if (new.fixado <> old.fixado or new.trancado <> old.trancado or new.tema_id <> old.tema_id) and not public.eh_moderador() then
    raise exception 'Somente a moderação fixa, tranca ou move tópicos' using errcode = '42501';
  end if;
  if (new.titulo <> old.titulo or new.corpo_md <> old.corpo_md) then
    if old.autor_id <> auth.uid() then
      raise exception 'Só o autor edita o tópico' using errcode = '42501';
    end if;
    if old.oculto then raise exception 'Conteúdo removido pela moderação não pode ser editado'; end if;
    new.editado_em := now();
  end if;
  if (new.status <> old.status or new.excluido_em is distinct from old.excluido_em)
     and old.autor_id <> auth.uid() and not public.eh_moderador() then
    raise exception 'Só o autor ou a moderação alteram o status' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger topicos_validar before insert or update on public.topicos
  for each row execute function public.validar_topico();

-- ---------------------------------------------------------------- respostas
create or replace function public.validar_resposta() returns trigger language plpgsql as $$
declare
  v_topico record;
  v_pai record;
begin
  if not public.eh_cliente() then return new; end if;
  select autor_id, trancado, oculto, excluido_em into v_topico from public.topicos where id = new.topico_id;
  if tg_op = 'INSERT' then
    if v_topico is null or v_topico.excluido_em is not null or v_topico.oculto then
      raise exception 'Tópico indisponível';
    end if;
    if v_topico.trancado then raise exception 'Este tópico está trancado para novas respostas'; end if;
    if new.resposta_pai_id is not null then
      select topico_id, resposta_pai_id into v_pai from public.respostas where id = new.resposta_pai_id;
      if v_pai is null or v_pai.topico_id <> new.topico_id then raise exception 'Resposta de origem inválida'; end if;
      -- árvore de no máximo 2 níveis: respondendo a uma sub-resposta, sobe para a raiz
      if v_pai.resposta_pai_id is not null then new.resposta_pai_id := v_pai.resposta_pai_id; end if;
    end if;
    new.autor_id := auth.uid();
    new.marcada_como_util := false; new.oculto := false; new.editado_em := null; new.excluido_em := null;
    return new;
  end if;
  if new.autor_id <> old.autor_id or new.topico_id <> old.topico_id
     or new.resposta_pai_id is distinct from old.resposta_pai_id or new.oculto <> old.oculto then
    raise exception 'Alteração não permitida' using errcode = '42501';
  end if;
  if new.corpo_md <> old.corpo_md then
    if old.autor_id <> auth.uid() then raise exception 'Só o autor edita a resposta' using errcode = '42501'; end if;
    if old.oculto then raise exception 'Conteúdo removido pela moderação não pode ser editado'; end if;
    new.editado_em := now();
  end if;
  if new.marcada_como_util <> old.marcada_como_util and v_topico.autor_id <> auth.uid() then
    raise exception 'Só o autor do tópico marca respostas úteis' using errcode = '42501';
  end if;
  if new.excluido_em is distinct from old.excluido_em and old.autor_id <> auth.uid() and not public.eh_moderador() then
    raise exception 'Só o autor exclui a resposta' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger respostas_validar before insert or update on public.respostas
  for each row execute function public.validar_resposta();

create or replace function public.apos_resposta() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_topico record;
  v_pai_autor uuid;
begin
  select id, autor_id, titulo into v_topico from public.topicos where id = new.topico_id;
  if tg_op = 'INSERT' then
    update public.topicos set ultima_atividade_em = now() where id = new.topico_id;
    if v_topico.autor_id <> new.autor_id then
      perform public.notificar(v_topico.autor_id, 'resposta_topico',
        'Nova resposta em "' || left(v_topico.titulo, 60) || '"',
        public.nome_publico(new.autor_id) || ' respondeu ao seu tópico.',
        '/biblioteca/topico/' || new.topico_id);
    end if;
    if new.resposta_pai_id is not null then
      select autor_id into v_pai_autor from public.respostas where id = new.resposta_pai_id;
      if v_pai_autor <> new.autor_id and v_pai_autor <> v_topico.autor_id then
        perform public.notificar(v_pai_autor, 'resposta_topico',
          'Responderam ao seu comentário', left(v_topico.titulo, 80), '/biblioteca/topico/' || new.topico_id);
      end if;
    end if;
    return new;
  end if;
  -- marcação de resposta útil (o autor do tópico não pontua marcando a si mesmo)
  if new.marcada_como_util is distinct from old.marcada_como_util and new.autor_id <> v_topico.autor_id then
    if new.marcada_como_util then
      perform public.registrar_reputacao(new.autor_id, 'resposta_util', 'resposta', new.id);
    else
      perform public.estornar_reputacao(new.autor_id, 'resposta_util', new.id);
    end if;
  end if;
  return new;
end $$;
create trigger respostas_apos after insert or update on public.respostas
  for each row execute function public.apos_resposta();

-- ---------------------------------------------------------------- artigos
create or replace function public.validar_artigo() returns trigger language plpgsql as $$
begin
  if not public.eh_cliente() then return new; end if;
  if tg_op = 'INSERT' then
    new.criado_por := auth.uid();
    new.status := 'rascunho'; new.rodada_revisao := 0; new.publicado_em := null;
    new.oculto := false; new.excluido_em := null;
    return new;
  end if;
  if not public.eh_autor_artigo(old.id) and not public.eh_admin() then
    raise exception 'Só autores editam o artigo' using errcode = '42501';
  end if;
  if new.criado_por <> old.criado_por or new.publicado_em is distinct from old.publicado_em
     or new.oculto <> old.oculto or new.rodada_revisao <> old.rodada_revisao then
    raise exception 'Alteração não permitida' using errcode = '42501';
  end if;
  -- conteúdo só muda fora da revisão e antes da publicação
  if (new.titulo <> old.titulo or new.corpo_md <> old.corpo_md or new.resumo is distinct from old.resumo
      or new.capa_url is distinct from old.capa_url or new.tema_id <> old.tema_id)
     and old.status not in ('rascunho', 'recusado') then
    raise exception 'Artigo em revisão ou publicado não pode ser editado' using errcode = '42501';
  end if;
  if new.status <> old.status then
    if old.status = 'rascunho' and new.status = 'em_revisao' then
      if length(new.corpo_md) < 300 then
        raise exception 'O artigo precisa de pelo menos 300 caracteres para ir à revisão';
      end if;
      new.rodada_revisao := old.rodada_revisao + 1;
    elsif old.status = 'em_revisao' and new.status = 'rascunho' then
      null; -- autor retirou da revisão
    elsif old.status = 'recusado' and new.status = 'rascunho' then
      null; -- retrabalho após recusa
    else
      raise exception 'Transição de status inválida (% → %)', old.status, new.status using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger artigos_validar before insert or update on public.artigos
  for each row execute function public.validar_artigo();

create or replace function public.apos_artigo() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_autores uuid[];
  v_autor uuid;
  v_qtd integer;
begin
  if tg_op = 'INSERT' then
    insert into public.artigo_autores (artigo_id, profile_id, papel) values (new.id, new.criado_por, 'autor')
    on conflict do nothing;
    return new;
  end if;
  if new.status = 'publicado' and old.status <> 'publicado' then
    select array_agg(distinct profile_id) into v_autores from public.artigo_autores
     where artigo_id = new.id and papel in ('autor', 'coautor');
    v_qtd := coalesce(array_length(v_autores, 1), 1);
    foreach v_autor in array coalesce(v_autores, '{}') loop
      perform public.registrar_reputacao(v_autor, 'artigo_publicado', 'artigo', new.id, 1.0 / v_qtd);
      perform public.notificar(v_autor, 'artigo_publicado', 'Seu artigo foi publicado!',
        '"' || left(new.titulo, 80) || '" agora faz parte da Biblioteca.', '/biblioteca/artigo/' || new.id);
    end loop;
  end if;
  return new;
end $$;
create trigger artigos_apos after insert or update on public.artigos
  for each row execute function public.apos_artigo();

-- coautores: autores adicionam coautores enquanto o artigo é rascunho
create or replace function public.validar_artigo_autor() returns trigger language plpgsql as $$
declare v_status public.status_artigo;
begin
  if not public.eh_cliente() then return coalesce(new, old); end if;
  select status into v_status from public.artigos where id = coalesce(new.artigo_id, old.artigo_id);
  if coalesce(new.papel, old.papel) <> 'coautor' then
    raise exception 'Pelo app só é possível adicionar ou remover coautores' using errcode = '42501';
  end if;
  if v_status <> 'rascunho' then raise exception 'Coautoria só muda enquanto o artigo é rascunho'; end if;
  return coalesce(new, old);
end $$;
create trigger artigo_autores_validar before insert or delete on public.artigo_autores
  for each row execute function public.validar_artigo_autor();

-- ---------------------------------------------------------------- revisões
create or replace function public.validar_revisao() returns trigger language plpgsql as $$
declare v_artigo record;
begin
  if not public.eh_cliente() then return new; end if;
  select status, rodada_revisao into v_artigo from public.artigos where id = new.artigo_id;
  if v_artigo.status is distinct from 'em_revisao' then raise exception 'Este artigo não está em revisão'; end if;
  if public.eh_autor_artigo(new.artigo_id) then
    raise exception 'Ninguém revisa o próprio artigo' using errcode = '42501';
  end if;
  new.revisor_id := auth.uid();
  new.rodada := v_artigo.rodada_revisao;
  return new;
end $$;
create trigger revisoes_validar before insert on public.revisoes
  for each row execute function public.validar_revisao();
create trigger revisoes_imutavel before update or delete on public.revisoes
  for each row execute function public.bloquear_alteracao();

create or replace function public.apos_revisao() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_artigo record;
  v_aprovacoes integer;
  v_necessarias integer := public.config_num('revisao', 'aprovacoes_necessarias', 2)::integer;
  v_autor uuid;
  v_msg text;
begin
  select * into v_artigo from public.artigos where id = new.artigo_id;
  insert into public.artigo_autores (artigo_id, profile_id, papel) values (new.artigo_id, new.revisor_id, 'revisor')
  on conflict do nothing;
  perform public.registrar_reputacao(new.revisor_id, 'revisao_concluida', 'revisao', new.id, 1, false);

  if new.parecer = 'recusar' then
    update public.artigos set status = 'recusado' where id = new.artigo_id;
    v_msg := 'Seu artigo foi recusado na revisão. Leia o parecer.';
  elsif new.parecer = 'pedir_mudancas' then
    update public.artigos set status = 'rascunho' where id = new.artigo_id;
    v_msg := 'Um curador pediu mudanças no seu artigo.';
  else
    select count(distinct revisor_id) into v_aprovacoes from public.revisoes r
     where r.artigo_id = new.artigo_id and r.rodada = new.rodada and r.parecer = 'aprovar'
       and not public.eh_autor_artigo(new.artigo_id, r.revisor_id);
    if v_aprovacoes >= v_necessarias then
      update public.artigos set status = 'publicado', publicado_em = now() where id = new.artigo_id;
      return new; -- a notificação de publicação sai do trigger de artigos
    end if;
    v_msg := 'Seu artigo recebeu uma aprovação (' || v_aprovacoes || ' de ' || v_necessarias || ').';
  end if;
  for v_autor in select profile_id from public.artigo_autores where artigo_id = new.artigo_id and papel in ('autor', 'coautor') loop
    perform public.notificar(v_autor, 'artigo_revisado', 'Revisão: ' || left(v_artigo.titulo, 60), v_msg,
      '/biblioteca/artigo/' || new.artigo_id);
  end loop;
  return new;
end $$;
create trigger revisoes_apos after insert on public.revisoes
  for each row execute function public.apos_revisao();

-- ---------------------------------------------------------------- trilhas
create or replace function public.validar_trilha() returns trigger language plpgsql as $$
declare v_itens integer;
begin
  if not public.eh_cliente() then return new; end if;
  if tg_op = 'INSERT' then
    new.curador_id := auth.uid();
    new.publicada := false; new.publicada_em := null; new.destaque := false;
    return new;
  end if;
  if new.curador_id <> old.curador_id then raise exception 'Alteração não permitida' using errcode = '42501'; end if;
  if new.destaque <> old.destaque and not public.eh_admin() then
    raise exception 'Somente admins destacam trilhas' using errcode = '42501';
  end if;
  if new.publicada and not old.publicada then
    select count(*) into v_itens from public.trilha_itens where trilha_id = new.id;
    if v_itens < 2 then raise exception 'Uma trilha precisa de pelo menos 2 artigos'; end if;
    new.publicada_em := coalesce(old.publicada_em, now());
  end if;
  return new;
end $$;
create trigger trilhas_validar before insert or update on public.trilhas
  for each row execute function public.validar_trilha();

create or replace function public.apos_trilha() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.publicada and not old.publicada then
    perform public.registrar_reputacao(new.curador_id, 'trilha_publicada', 'trilha', new.id);
  end if;
  return new;
end $$;
create trigger trilhas_apos after update on public.trilhas
  for each row execute function public.apos_trilha();

create or replace function public.validar_trilha_item() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.artigos where id = new.artigo_id and status = 'publicado' and not oculto) then
    raise exception 'Trilhas só incluem artigos publicados';
  end if;
  return new;
end $$;
create trigger trilha_itens_validar before insert or update on public.trilha_itens
  for each row execute function public.validar_trilha_item();

-- Reordenação atômica (arrastar e soltar): recebe a lista completa de artigos
create or replace function public.definir_itens_trilha(p_trilha uuid, p_artigos uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.trilhas where id = p_trilha and (curador_id = auth.uid() or public.eh_admin()))
     or not public.tem_nivel(3) then
    raise exception 'Só o curador da trilha pode organizá-la' using errcode = '42501';
  end if;
  delete from public.trilha_itens where trilha_id = p_trilha;
  insert into public.trilha_itens (trilha_id, artigo_id, ordem)
  select p_trilha, a, ord::integer from unnest(p_artigos) with ordinality as t(a, ord);
end $$;

-- Marcar como lido: avança as trilhas e emite o "certificado" quando conclui.
create or replace function public.marcar_artigo_lido(p_artigo uuid, p_trilha uuid default null)
returns table (trilha_id uuid, concluida boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_trilha uuid;
  v_total integer;
  v_feitos integer;
  v_titulo text;
begin
  if not public.pode_ler() then raise exception 'Acesso restrito a membros ativos' using errcode = '42501'; end if;
  if not exists (select 1 from public.artigos where id = p_artigo and status = 'publicado') then
    raise exception 'Artigo não encontrado';
  end if;
  for v_trilha in
    select ti.trilha_id from public.trilha_itens ti join public.trilhas t on t.id = ti.trilha_id
    where ti.artigo_id = p_artigo and t.publicada
      and (ti.trilha_id = p_trilha
           or exists (select 1 from public.progresso_trilha pt where pt.profile_id = v_uid and pt.trilha_id = ti.trilha_id))
  loop
    insert into public.progresso_trilha (profile_id, trilha_id, artigo_id) values (v_uid, v_trilha, p_artigo)
    on conflict do nothing;
    select count(*) into v_total from public.trilha_itens where trilha_itens.trilha_id = v_trilha;
    select count(*) into v_feitos from public.progresso_trilha pt
      join public.trilha_itens ti on ti.trilha_id = pt.trilha_id and ti.artigo_id = pt.artigo_id
     where pt.profile_id = v_uid and pt.trilha_id = v_trilha;
    if v_feitos >= v_total then
      insert into public.trilhas_concluidas (profile_id, trilha_id) values (v_uid, v_trilha) on conflict do nothing;
      if found then
        select titulo into v_titulo from public.trilhas where id = v_trilha;
        perform public.notificar(v_uid, 'trilha_concluida', 'Trilha concluída: ' || left(v_titulo, 60),
          'Seu certificado está no seu perfil.', '/biblioteca/trilha/' || v_trilha, 'trilha:' || v_trilha);
      end if;
      trilha_id := v_trilha; concluida := true; return next;
    else
      trilha_id := v_trilha; concluida := false; return next;
    end if;
  end loop;
end $$;
