-- Aulas e encontros por voz (Discord): tipos de evento, presença medida pela call,
-- avaliação do professor por quem participou e reputação (→ Dracmas) para quem ensinou.
--
-- Fluxo:
--   1. Membro (nível 2+) marca uma aula com canal de voz. O bot do Discord cria o evento
--      agendado apontando para o canal.
--   2. Durante a aula o bot soma, minuto a minuto, quem está na call (presencas_voz).
--   3. No fim, confirmar_presenca_voz() marca presença de quem ficou tempo suficiente
--      (rsvps.presente → +pontos de presença, exceto em sessões da Assembleia).
--   4. Por 48 h, quem esteve presente avalia (1 a 5 estrelas, anônimo).
--   5. fechar_avaliacoes_aulas() fecha a janela e, com avaliações suficientes e média
--      boa, credita 'aula_ministrada' ao professor (vira DRC no fechamento semanal).

-- ---------------------------------------------------------------- configuração
insert into public.configuracoes (chave, valor, descricao) values
  ('aulas', '{
      "janela_horas": 48,
      "avaliacoes_minimas": 3,
      "nota_minima": 3.5,
      "nota_excelente": 4.5,
      "bonus_excelente": 1.5,
      "idade_conta_dias": 7,
      "max_pontuadas_semana": 3,
      "presenca_minutos_max": 30,
      "presenca_fracao": 0.5,
      "duracao_max_horas": 4,
      "aulas_futuras_max": 5
   }', 'Aulas por voz: presença mínima, janela e regras da avaliação que gera reputação para quem ensinou')
on conflict (chave) do nothing;

update public.configuracoes set valor = valor || '{"aula_ministrada": 20}'::jsonb
 where chave = 'pontos' and not (valor ? 'aula_ministrada');

-- ---------------------------------------------------------------- eventos: tipo, tema, proposta e canal de voz
alter table public.eventos
  add column tipo text not null default 'mutirao' check (tipo in ('mutirao', 'aula', 'assembleia', 'encontro')),
  add column tema_id uuid references public.temas (id) on delete set null,
  add column proposta_id uuid references public.propostas (id) on delete set null,
  add column canal_voz_id text check (canal_voz_id ~ '^[0-9]{15,22}$'),
  add column avaliacao_fechada_em timestamptz,
  add column avaliacao_media numeric(3, 2),
  add column avaliacao_total integer;

comment on column public.eventos.tipo is 'mutirao (ação do Mutirão), aula (alguém ensina; é avaliada), assembleia (sessão de debate de uma proposta), encontro';
comment on column public.eventos.canal_voz_id is 'Canal de voz do Discord onde o evento acontece; com ele a presença é medida pela call';

create index eventos_aulas_idx on public.eventos (tipo, fim) where excluido_em is null;

-- Quem pode marcar: aulas a partir do nível 2; sessões da Assembleia a partir do nível 3
-- (quem abre propostas); o resto como antes (coordenação ou nível 4).
drop policy "eventos: organização cria" on public.eventos;
create policy "eventos: organização cria" on public.eventos for insert to authenticated
  with check (
    criado_por = auth.uid() and (
      public.pode_organizar_evento(nucleo_id, projeto_id)
      or (tipo = 'aula' and public.tem_nivel(2))
      or (tipo = 'assembleia' and public.tem_nivel(3))
    )
  );

create or replace function public.validar_evento_tipo() returns trigger language plpgsql as $$
declare
  v_cfg jsonb := public.config('aulas');
  v_futuras integer;
begin
  if not public.eh_cliente() then return new; end if;
  if tg_op = 'UPDATE' then
    if new.tipo <> old.tipo then raise exception 'O tipo do evento não muda depois de criado' using errcode = '42501'; end if;
    if new.avaliacao_fechada_em is distinct from old.avaliacao_fechada_em
       or new.avaliacao_media is distinct from old.avaliacao_media
       or new.avaliacao_total is distinct from old.avaliacao_total then
      raise exception 'O resultado da avaliação é calculado pelo sistema' using errcode = '42501';
    end if;
    return new;
  end if;
  new.avaliacao_fechada_em := null;
  new.avaliacao_media := null;
  new.avaliacao_total := null;
  if new.tipo = 'aula' then
    if new.fim - new.inicio > make_interval(hours => coalesce((v_cfg ->> 'duracao_max_horas')::int, 4)) then
      raise exception 'Uma aula pode durar no máximo % horas', coalesce((v_cfg ->> 'duracao_max_horas')::int, 4);
    end if;
    select count(*) into v_futuras from public.eventos
     where criado_por = auth.uid() and tipo = 'aula' and excluido_em is null and fim > now();
    if v_futuras >= coalesce((v_cfg ->> 'aulas_futuras_max')::int, 5) then
      raise exception 'Você já tem % aulas marcadas. Dê alguma antes de marcar mais.', v_futuras;
    end if;
  end if;
  if new.tipo = 'assembleia' and new.proposta_id is null then
    raise exception 'Sessão da Assembleia precisa de uma proposta';
  end if;
  return new;
end $$;
create trigger eventos_validar_tipo before insert or update on public.eventos
  for each row execute function public.validar_evento_tipo();

-- ---------------------------------------------------------------- presença medida pela call
-- Minutos de cada conta do Discord no canal do evento (escrito só pelo bot).
create table public.presencas_voz (
  evento_id uuid not null references public.eventos (id) on delete cascade,
  discord_id text not null,
  minutos integer not null default 0,
  primeiro_em timestamptz not null default now(),
  ultimo_em timestamptz not null default now(),
  primary key (evento_id, discord_id)
);
comment on table public.presencas_voz is 'Minutos na call do evento por conta do Discord, somados pelo bot a cada minuto';
alter table public.presencas_voz enable row level security;
revoke all on public.presencas_voz from anon, authenticated;
grant all on public.presencas_voz to service_role;

create or replace function public.somar_minutos_voz(p_evento uuid, p_discord_ids text[], p_minutos integer default 1)
returns void language sql security definer set search_path = public as $$
  insert into public.presencas_voz (evento_id, discord_id, minutos)
  select p_evento, d, p_minutos from unnest(p_discord_ids) as d
  on conflict (evento_id, discord_id)
  do update set minutos = public.presencas_voz.minutos + excluded.minutos, ultimo_em = now()
$$;

/** Minutos mínimos na call para contar presença: metade da duração, no máximo 30 min. */
create or replace function public.minutos_minimos_presenca(p_evento uuid) returns integer
language sql stable security definer set search_path = public as $$
  select greatest(1, least(
    coalesce((public.config('aulas') ->> 'presenca_minutos_max')::int, 30),
    ceil(extract(epoch from (e.fim - e.inicio)) / 60 * coalesce((public.config('aulas') ->> 'presenca_fracao')::numeric, 0.5))::int
  )) from public.eventos e where e.id = p_evento
$$;

/**
 * Confirma presença de quem ficou tempo suficiente na call (todas as contas do Discord
 * já ligadas a contas da Ágora, ou só a de p_discord_id). Quem organizou não ganha presença
 * no próprio evento. Devolve quantas presenças novas foram registradas.
 */
create or replace function public.confirmar_presenca_voz(p_evento uuid, p_discord_id text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_min integer := public.minutos_minimos_presenca(p_evento);
  v_qtd integer := 0;
  r record;
begin
  for r in
    select v.profile_id from public.presencas_voz pv
    join public.discord_vinculos v on v.discord_id = pv.discord_id
    join public.eventos e on e.id = pv.evento_id
    where pv.evento_id = p_evento and pv.minutos >= v_min
      and (p_discord_id is null or pv.discord_id = p_discord_id)
      and v.profile_id <> e.criado_por
  loop
    insert into public.rsvps (evento_id, profile_id, status, presente, checkin_em)
    values (p_evento, r.profile_id, 'vou', true, now())
    on conflict (evento_id, profile_id) do update set presente = true, checkin_em = coalesce(public.rsvps.checkin_em, now())
    where not public.rsvps.presente;
    if found then v_qtd := v_qtd + 1; end if;
  end loop;
  return v_qtd;
end $$;

revoke execute on function public.somar_minutos_voz(uuid, text[], integer) from public, anon, authenticated;
revoke execute on function public.confirmar_presenca_voz(uuid, text) from public, anon, authenticated;
grant execute on function public.somar_minutos_voz(uuid, text[], integer) to service_role;
grant execute on function public.confirmar_presenca_voz(uuid, text) to service_role;

-- Presença em sessão da Assembleia fica registrada (transparência), mas não vale pontos:
-- ninguém ganha Dracmas por comparecer a decisões.
create or replace function public.apos_rsvp() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_tipo text;
begin
  select tipo into v_tipo from public.eventos where id = new.evento_id;
  if v_tipo = 'assembleia' then return new; end if;
  if new.presente and (tg_op = 'INSERT' or not old.presente) then
    perform public.registrar_reputacao(new.profile_id, 'presenca_evento', 'evento', new.evento_id);
  elsif not new.presente and tg_op = 'UPDATE' and old.presente then
    perform public.estornar_reputacao(new.profile_id, 'presenca_evento', new.evento_id);
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------- avaliação das aulas
create table public.avaliacoes_evento (
  evento_id uuid not null references public.eventos (id) on delete cascade,
  profile_id uuid not null references public.profiles (id),
  nota smallint not null check (nota between 1 and 5),
  comentario text check (comentario is null or length(comentario) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (evento_id, profile_id)
);
comment on table public.avaliacoes_evento is 'Notas (1–5) de quem participou de uma aula; anônimas para o professor';

/** Pode avaliar: aula já terminada, janela aberta, esteve presente e não é quem deu a aula. */
create or replace function public.pode_avaliar_evento(p_evento uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.pode_escrever() and exists (
    select 1 from public.eventos e
    join public.rsvps r on r.evento_id = e.id and r.profile_id = auth.uid() and r.presente
    where e.id = p_evento and e.tipo = 'aula' and e.excluido_em is null
      and e.criado_por <> auth.uid()
      and e.avaliacao_fechada_em is null
      and now() >= e.fim - interval '10 minutes'
      and now() <= e.fim + make_interval(hours => coalesce((public.config('aulas') ->> 'janela_horas')::int, 48))
  )
$$;

alter table public.avaliacoes_evento enable row level security;
create policy "avaliacoes: a própria" on public.avaliacoes_evento for select to authenticated
  using (profile_id = auth.uid() or public.eh_admin());
create policy "avaliacoes: quem participou avalia" on public.avaliacoes_evento for insert to authenticated
  with check (profile_id = auth.uid() and public.pode_avaliar_evento(evento_id));
create policy "avaliacoes: muda a própria na janela" on public.avaliacoes_evento for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and public.pode_avaliar_evento(evento_id));
revoke all on public.avaliacoes_evento from anon;
grant select, insert, update on public.avaliacoes_evento to authenticated;

create or replace function public.tocar_avaliacao() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger avaliacoes_tocar before update on public.avaliacoes_evento
  for each row execute function public.tocar_avaliacao();

/**
 * Resumo da avaliação: total e média para qualquer membro; os comentários (sem autoria)
 * só para quem deu a aula e para a administração.
 */
create or replace function public.resumo_avaliacoes(p_evento uuid)
returns table (total integer, media numeric, comentarios text[], fechada_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare v_dono boolean;
begin
  if not public.pode_ler() then return; end if;
  select (e.criado_por = auth.uid() or public.eh_admin()) into v_dono from public.eventos e where e.id = p_evento;
  return query
    select count(a.*)::int, round(avg(a.nota), 2),
           case when v_dono then array_remove(array_agg(a.comentario order by a.created_at), null) else null end,
           (select e.avaliacao_fechada_em from public.eventos e where e.id = p_evento)
    from public.avaliacoes_evento a where a.evento_id = p_evento;
end $$;
revoke execute on function public.resumo_avaliacoes(uuid) from public, anon;
grant execute on function public.resumo_avaliacoes(uuid) to authenticated, service_role;

/**
 * Fecha as avaliações das aulas cuja janela acabou. Contam para a reputação só as notas de
 * contas com pelo menos 7 dias antes da aula (contas novas aparecem para o professor, mas
 * não pesam). Com o mínimo de avaliações e média boa, o professor recebe 'aula_ministrada'
 * (×1,5 com média excelente), até 3 aulas pontuadas por semana.
 */
create or replace function public.fechar_avaliacoes_aulas() returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_cfg jsonb := public.config('aulas');
  v_janela interval := make_interval(hours => coalesce((v_cfg ->> 'janela_horas')::int, 48));
  v_idade interval := make_interval(days => coalesce((v_cfg ->> 'idade_conta_dias')::int, 7));
  v_min integer := coalesce((v_cfg ->> 'avaliacoes_minimas')::int, 3);
  v_nota_min numeric := coalesce((v_cfg ->> 'nota_minima')::numeric, 3.5);
  v_nota_exc numeric := coalesce((v_cfg ->> 'nota_excelente')::numeric, 4.5);
  v_bonus numeric := coalesce((v_cfg ->> 'bonus_excelente')::numeric, 1.5);
  v_max_semana integer := coalesce((v_cfg ->> 'max_pontuadas_semana')::int, 3);
  e record;
  v_total integer;
  v_media numeric;
  v_validas integer;
  v_media_validas numeric;
  v_semana integer;
  v_pontua boolean;
  v_qtd integer := 0;
begin
  for e in
    select * from public.eventos
    where tipo = 'aula' and excluido_em is null and avaliacao_fechada_em is null and fim + v_janela < now()
    order by fim
    for update skip locked
  loop
    select count(*), round(avg(nota), 2) into v_total, v_media from public.avaliacoes_evento where evento_id = e.id;
    select count(*), avg(a.nota) into v_validas, v_media_validas
      from public.avaliacoes_evento a join public.profiles p on p.id = a.profile_id
     where a.evento_id = e.id and p.created_at <= e.inicio - v_idade;
    select count(*) into v_semana from public.reputacao_eventos
     where profile_id = e.criado_por and acao = 'aula_ministrada' and criado_em > now() - interval '7 days';
    v_pontua := v_validas >= v_min and v_media_validas >= v_nota_min and v_semana < v_max_semana;

    update public.eventos set avaliacao_fechada_em = now(), avaliacao_media = v_media, avaliacao_total = v_total where id = e.id;
    if v_pontua then
      perform public.registrar_reputacao(e.criado_por, 'aula_ministrada', 'evento', e.id,
        case when v_media_validas >= v_nota_exc then v_bonus else 1 end);
    end if;
    perform public.notificar(
      e.criado_por, 'aula_avaliada',
      'Avaliação da aula: ' || left(e.titulo, 60),
      case
        when v_total = 0 then 'Ninguém avaliou desta vez.'
        when v_pontua then 'Média ' || to_char(v_media, 'FM0D0') || ' em ' || v_total || ' avaliações. Você ganhou reputação (e Dracmas) por ensinar!'
        when v_semana >= v_max_semana then 'Média ' || to_char(v_media, 'FM0D0') || ' em ' || v_total || ' avaliações. Você já atingiu o limite de aulas pontuadas nesta semana.'
        else 'Média ' || to_char(v_media, 'FM0D0') || ' em ' || v_total || ' avaliações. Para pontuar são precisas ' || v_min || ' avaliações de membros (contas com 7+ dias) e média ' || to_char(v_nota_min, 'FM0D0') || '.'
      end,
      '/mutirao/evento/' || e.id, 'aula-avaliada:' || e.id);
    v_qtd := v_qtd + 1;
  end loop;
  return v_qtd;
end $$;
revoke execute on function public.fechar_avaliacoes_aulas() from public, anon, authenticated;
grant execute on function public.fechar_avaliacoes_aulas() to service_role;

-- ---------------------------------------------------------------- mensagens de avaliação no Discord
-- Mensagem com as estrelas que o bot posta no chat do canal de voz quando a aula termina.
create table public.discord_avaliacoes (
  evento_id uuid primary key references public.eventos (id) on delete cascade,
  canal_id text not null,
  mensagem_id text,
  resultado_publicado_em timestamptz,
  criado_em timestamptz not null default now()
);
alter table public.discord_avaliacoes enable row level security;
revoke all on public.discord_avaliacoes from anon, authenticated;
grant all on public.discord_avaliacoes to service_role;

-- ---------------------------------------------------------------- agendamento
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('agora-aulas', '17 * * * *', 'select public.fechar_avaliacoes_aulas()');
  end if;
end $$;
