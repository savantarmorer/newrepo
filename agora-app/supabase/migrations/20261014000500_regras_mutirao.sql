-- ============================================================================
-- Ágora · 005 · Regras do Mutirão (projetos, tarefas, horas, eventos, caixa, doações)
-- ============================================================================

-- ---------------------------------------------------------------- projetos
create or replace function public.validar_projeto() returns trigger language plpgsql as $$
begin
  if not public.eh_cliente() then return new; end if;
  if tg_op = 'INSERT' then
    new.coordenador_id := auth.uid();
    new.oculto := false; new.concluido_em := null; new.excluido_em := null;
    if new.status not in ('planejamento', 'ativo') then new.status := 'planejamento'; end if;
    return new;
  end if;
  if not public.coordena_projeto(old.id) then
    raise exception 'Só a coordenação do projeto o edita' using errcode = '42501';
  end if;
  if new.coordenador_id <> old.coordenador_id and not public.eh_admin() then
    raise exception 'Só admins trocam a coordenação' using errcode = '42501';
  end if;
  if new.oculto <> old.oculto then raise exception 'Alteração não permitida' using errcode = '42501'; end if;
  if old.status in ('concluido', 'cancelado') and new.status <> old.status then
    raise exception 'Projeto encerrado não muda de status';
  end if;
  new.concluido_em := old.concluido_em;
  return new;
end $$;
create trigger projetos_validar before insert or update on public.projetos
  for each row execute function public.validar_projeto();

create or replace function public.apos_projeto() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.projeto_membros (projeto_id, profile_id, papel) values (new.id, new.coordenador_id, 'coordenador')
    on conflict (projeto_id, profile_id) do update set papel = 'coordenador';
    return new;
  end if;
  if new.coordenador_id <> old.coordenador_id then
    insert into public.projeto_membros (projeto_id, profile_id, papel) values (new.id, new.coordenador_id, 'coordenador')
    on conflict (projeto_id, profile_id) do update set papel = 'coordenador';
  end if;
  if new.status = 'concluido' and old.status <> 'concluido' then
    update public.projetos set concluido_em = now() where id = new.id;
    perform public.registrar_reputacao(new.coordenador_id, 'projeto_concluido', 'projeto', new.id);
  end if;
  return new;
end $$;
create trigger projetos_apos after insert or update on public.projetos
  for each row execute function public.apos_projeto();

-- ---------------------------------------------------------------- tarefas
create or replace function public.validar_tarefa() returns trigger language plpgsql as $$
declare v_coord boolean;
begin
  if not public.eh_cliente() then return new; end if;
  v_coord := public.coordena_projeto(coalesce(new.projeto_id, old.projeto_id));
  if tg_op = 'INSERT' then
    if not v_coord and not (public.participa_projeto(new.projeto_id) and public.tem_nivel(2)) then
      raise exception 'Criar tarefas exige nível Colaborador e participar do projeto' using errcode = '42501';
    end if;
    new.criado_por := auth.uid();
    if not v_coord and new.responsavel_id is not null and new.responsavel_id <> auth.uid() then
      raise exception 'Só a coordenação atribui tarefas a outras pessoas' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.projeto_id <> old.projeto_id then raise exception 'Alteração não permitida' using errcode = '42501'; end if;
  if v_coord then return new; end if;
  -- quem não coordena: assume tarefa livre, libera a própria, muda status da própria
  if new.titulo <> old.titulo or new.descricao is distinct from old.descricao or new.prazo is distinct from old.prazo
     or new.horas_estimadas is distinct from old.horas_estimadas or new.excluido_em is distinct from old.excluido_em then
    raise exception 'Só a coordenação edita os detalhes da tarefa' using errcode = '42501';
  end if;
  if new.responsavel_id is distinct from old.responsavel_id then
    if not ((old.responsavel_id is null and new.responsavel_id = auth.uid())
            or (old.responsavel_id = auth.uid() and new.responsavel_id is null)) then
      raise exception 'Você só pode assumir uma tarefa livre ou liberar a sua' using errcode = '42501';
    end if;
  elsif new.status <> old.status and old.responsavel_id is distinct from auth.uid() then
    raise exception 'Só o responsável muda o status da tarefa' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger tarefas_validar before insert or update on public.tarefas
  for each row execute function public.validar_tarefa();

create or replace function public.apos_tarefa() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_proj text;
begin
  if new.responsavel_id is not null and (tg_op = 'INSERT' or new.responsavel_id is distinct from old.responsavel_id) then
    insert into public.projeto_membros (projeto_id, profile_id) values (new.projeto_id, new.responsavel_id)
    on conflict do nothing;
    if new.responsavel_id is distinct from auth.uid() then
      select titulo into v_proj from public.projetos where id = new.projeto_id;
      perform public.notificar(new.responsavel_id, 'tarefa_atribuida', 'Tarefa atribuída a você',
        new.titulo || ' · ' || left(v_proj, 60), '/mutirao/tarefa/' || new.id);
    end if;
  end if;
  return new;
end $$;
create trigger tarefas_apos after insert or update on public.tarefas
  for each row execute function public.apos_tarefa();

-- ---------------------------------------------------------------- horas de voluntariado
create or replace function public.validar_horas() returns trigger language plpgsql as $$
begin
  if not public.eh_cliente() then return new; end if;
  if tg_op = 'UPDATE' then
    raise exception 'Horas registradas não são editadas; a coordenação confirma pelo app' using errcode = '42501';
  end if;
  if not public.participa_projeto(new.projeto_id) then
    raise exception 'Entre no projeto ("Quero ajudar") antes de registrar horas' using errcode = '42501';
  end if;
  new.profile_id := auth.uid();
  new.confirmado_por := null; new.confirmado_em := null; new.recusado_em := null;
  return new;
end $$;
create trigger horas_validar before insert or update on public.horas_voluntariado
  for each row execute function public.validar_horas();

-- Confirmação pela coordenação (ninguém confirma as próprias horas)
create or replace function public.confirmar_horas(p_registro uuid, p_aprovar boolean default true) returns void
language plpgsql security definer set search_path = public as $$
declare v record;
begin
  select * into v from public.horas_voluntariado where id = p_registro for update;
  if v is null then raise exception 'Registro não encontrado'; end if;
  if not public.coordena_projeto(v.projeto_id) or not public.pode_escrever() then
    raise exception 'Só a coordenação do projeto confirma horas' using errcode = '42501';
  end if;
  if v.profile_id = auth.uid() then raise exception 'Ninguém confirma as próprias horas' using errcode = '42501'; end if;
  if v.confirmado_em is not null or v.recusado_em is not null then raise exception 'Registro já analisado'; end if;
  if p_aprovar then
    update public.horas_voluntariado set confirmado_por = auth.uid(), confirmado_em = now() where id = p_registro;
    perform public.registrar_reputacao(v.profile_id, 'hora_voluntariado', 'horas', v.id, v.horas);
    perform public.notificar(v.profile_id, 'horas_confirmadas', 'Horas confirmadas',
      v.horas || 'h de voluntariado foram confirmadas. Obrigado!', '/mutirao/projeto/' || v.projeto_id);
  else
    update public.horas_voluntariado set recusado_em = now() where id = p_registro;
    perform public.notificar(v.profile_id, 'horas_confirmadas', 'Registro de horas não confirmado',
      'Converse com a coordenação do projeto para entender o motivo.', '/mutirao/projeto/' || v.projeto_id);
  end if;
end $$;

-- ---------------------------------------------------------------- eventos
create or replace function public.pode_organizar_evento(p_nucleo uuid, p_projeto uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.pode_escrever() and (
    public.eh_admin()
    or public.tem_nivel(4)
    or (p_nucleo is not null and public.coordena_nucleo(p_nucleo))
    or (p_projeto is not null and public.coordena_projeto(p_projeto))
  )
$$;

create or replace function public.organiza_evento(p_evento uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.eventos e where e.id = p_evento
      and (e.criado_por = auth.uid() or public.eh_admin()
           or (e.nucleo_id is not null and public.coordena_nucleo(e.nucleo_id))
           or (e.projeto_id is not null and public.coordena_projeto(e.projeto_id)))
  )
$$;

create or replace function public.validar_evento() returns trigger language plpgsql as $$
begin
  if not public.eh_cliente() then return new; end if;
  if tg_op = 'INSERT' then
    new.criado_por := auth.uid();
  elsif new.criado_por <> old.criado_por then
    raise exception 'Alteração não permitida' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger eventos_validar before insert or update on public.eventos
  for each row execute function public.validar_evento();

create or replace function public.apos_evento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.eventos_codigos (evento_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger eventos_apos after insert on public.eventos
  for each row execute function public.apos_evento();

-- Código exibido em QR pela organização
create or replace function public.codigo_checkin_evento(p_evento uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_codigo text;
begin
  if not public.organiza_evento(p_evento) then
    raise exception 'Só a organização do evento vê o código' using errcode = '42501';
  end if;
  select codigo_checkin into v_codigo from public.eventos_codigos where evento_id = p_evento;
  return 'agora-checkin:' || p_evento || ':' || v_codigo;
end $$;

create or replace function public.validar_rsvp() returns trigger language plpgsql as $$
declare
  v_evento record;
  v_ocupadas integer;
begin
  if not public.eh_cliente() then return new; end if;
  if new.presente is distinct from (case when tg_op = 'UPDATE' then old.presente else false end)
     or new.checkin_em is distinct from (case when tg_op = 'UPDATE' then old.checkin_em else null end) then
    raise exception 'Presença só é registrada por check-in' using errcode = '42501';
  end if;
  new.profile_id := auth.uid();
  select * into v_evento from public.eventos where id = new.evento_id;
  if v_evento.fim < now() then raise exception 'Este evento já terminou'; end if;
  if new.status = 'vou' and v_evento.vagas is not null
     and (tg_op = 'INSERT' or old.status <> 'vou') then
    select count(*) into v_ocupadas from public.rsvps where evento_id = new.evento_id and status = 'vou';
    if v_ocupadas >= v_evento.vagas then raise exception 'Vagas esgotadas. Marque "talvez" para entrar na espera.'; end if;
  end if;
  return new;
end $$;
create trigger rsvps_validar before insert or update on public.rsvps
  for each row execute function public.validar_rsvp();

create or replace function public.apos_rsvp() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.presente and (tg_op = 'INSERT' or not old.presente) then
    perform public.registrar_reputacao(new.profile_id, 'presenca_evento', 'evento', new.evento_id);
  elsif not new.presente and tg_op = 'UPDATE' and old.presente then
    perform public.estornar_reputacao(new.profile_id, 'presenca_evento', new.evento_id);
  end if;
  return new;
end $$;
create trigger rsvps_apos after insert or update on public.rsvps
  for each row execute function public.apos_rsvp();

-- Check-in escaneando o QR da organização
create or replace function public.fazer_checkin(p_conteudo_qr text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_partes text[] := string_to_array(p_conteudo_qr, ':');
  v_evento uuid;
  v_ev record;
begin
  if not public.pode_escrever() then raise exception 'Acesso restrito a membros ativos' using errcode = '42501'; end if;
  if array_length(v_partes, 1) <> 3 or v_partes[1] <> 'agora-checkin' then raise exception 'QR Code inválido'; end if;
  begin
    v_evento := v_partes[2]::uuid;
  exception when others then
    raise exception 'QR Code inválido';
  end;
  select e.*, c.codigo_checkin into v_ev from public.eventos e join public.eventos_codigos c on c.evento_id = e.id
   where e.id = v_evento and e.excluido_em is null;
  if v_ev is null or v_ev.codigo_checkin <> v_partes[3] then raise exception 'QR Code inválido'; end if;
  if now() < v_ev.inicio - interval '1 hour' or now() > v_ev.fim + interval '2 hours' then
    raise exception 'O check-in só abre perto do horário do evento';
  end if;
  insert into public.rsvps (evento_id, profile_id, status, presente, checkin_em)
  values (v_evento, auth.uid(), 'vou', true, now())
  on conflict (evento_id, profile_id) do update set presente = true, checkin_em = now(), status = 'vou';
  return v_evento;
end $$;

-- Presença manual pela organização (quem esqueceu o celular, por exemplo)
create or replace function public.marcar_presenca(p_evento uuid, p_profile uuid, p_presente boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.organiza_evento(p_evento) then raise exception 'Só a organização marca presença' using errcode = '42501'; end if;
  if p_profile = auth.uid() then raise exception 'Faça seu próprio check-in pelo QR'; end if;
  insert into public.rsvps (evento_id, profile_id, status, presente, checkin_em)
  values (p_evento, p_profile, 'vou', p_presente, case when p_presente then now() end)
  on conflict (evento_id, profile_id) do update
    set presente = excluded.presente, checkin_em = excluded.checkin_em;
end $$;

-- ---------------------------------------------------------------- caixa transparente
create or replace function public.validar_lancamento() returns trigger language plpgsql as $$
declare v_original record;
begin
  if public.eh_cliente() then
    if not (public.coordena_projeto(new.projeto_id) and public.tem_nivel(4)) and not public.eh_admin() then
      raise exception 'Só a coordenação (nível Guardião) lança no caixa' using errcode = '42501';
    end if;
    if new.doacao_id is not null then raise exception 'Doações entram no caixa automaticamente' using errcode = '42501'; end if;
    new.lancado_por := auth.uid();
    new.created_at := now();
  end if;
  if new.estorno_de is not null then
    select * into v_original from public.caixa_lancamentos where id = new.estorno_de;
    if v_original is null or v_original.projeto_id <> new.projeto_id then raise exception 'Lançamento original inválido'; end if;
    if v_original.estorno_de is not null then raise exception 'Não se estorna um estorno'; end if;
    if new.tipo = v_original.tipo or new.valor <> v_original.valor then
      raise exception 'O estorno precisa ter o tipo oposto e o mesmo valor do original';
    end if;
    if length(trim(new.descricao)) < 20 then raise exception 'Justifique o estorno (mínimo de 20 caracteres)'; end if;
    new.categoria := 'Estorno';
  end if;
  return new;
end $$;
create trigger caixa_validar before insert on public.caixa_lancamentos
  for each row execute function public.validar_lancamento();
create trigger caixa_imutavel before update or delete on public.caixa_lancamentos
  for each row execute function public.bloquear_alteracao();

create or replace view public.caixa_resumo with (security_barrier = true) as
select
  p.id as projeto_id,
  coalesce(sum(c.valor) filter (where c.tipo = 'entrada'), 0)::numeric(12, 2) as total_entradas,
  coalesce(sum(c.valor) filter (where c.tipo = 'saida'), 0)::numeric(12, 2) as total_saidas,
  (coalesce(sum(c.valor) filter (where c.tipo = 'entrada'), 0)
   - coalesce(sum(c.valor) filter (where c.tipo = 'saida'), 0))::numeric(12, 2) as saldo,
  count(c.id)::integer as lancamentos
from public.projetos p
left join public.caixa_lancamentos c on c.projeto_id = p.id
where public.pode_ler()
group by p.id;

-- Série mensal para o gráfico entradas × saídas
create or replace function public.caixa_mensal(p_projeto uuid)
returns table (mes date, entradas numeric, saidas numeric)
language sql stable security definer set search_path = public as $$
  select date_trunc('month', data)::date as mes,
         coalesce(sum(valor) filter (where tipo = 'entrada'), 0) as entradas,
         coalesce(sum(valor) filter (where tipo = 'saida'), 0) as saidas
  from public.caixa_lancamentos
  where projeto_id = p_projeto and public.pode_ler()
  group by 1 order by 1
$$;

-- ---------------------------------------------------------------- doações
create or replace function public.validar_doacao() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if old.status <> 'pendente' and new.status <> old.status then
      raise exception 'Doação já finalizada' using errcode = '42501';
    end if;
    if new.valor <> old.valor or new.projeto_id <> old.projeto_id or new.doador_id is distinct from old.doador_id then
      raise exception 'Dados da doação são imutáveis' using errcode = '42501';
    end if;
    if new.status = 'confirmada' and old.status = 'pendente' then new.confirmada_em := now(); end if;
  end if;
  return new;
end $$;
create trigger doacoes_validar before insert or update on public.doacoes
  for each row execute function public.validar_doacao();

create or replace function public.apos_doacao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'confirmada' and old.status = 'pendente' then
    insert into public.caixa_lancamentos (projeto_id, tipo, valor, descricao, categoria, lancado_por, doacao_id, data)
    values (new.projeto_id, 'entrada', new.valor,
            case when new.anonima or new.doador_id is null then 'Doação anônima via Pix'
                 else 'Doação via Pix de ' || public.nome_publico(new.doador_id) end,
            'Doação', null, new.id, current_date);
  end if;
  return new;
end $$;
create trigger doacoes_apos after update on public.doacoes
  for each row execute function public.apos_doacao();
