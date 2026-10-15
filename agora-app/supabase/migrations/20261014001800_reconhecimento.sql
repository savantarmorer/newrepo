-- Reconhecimento de contribuições anteriores (ex.: quem já ajudava no Discord antes da Ágora).
-- Numa comunidade nova não há tópicos, projetos nem aulas para quem chega no nível 1 participar;
-- a administração "semeia" os primeiros Colaboradores e Curadores reconhecendo o que eles já
-- fizeram. Regras:
--   • só admins; até 250 pontos por pessoa no total (no máximo Curador — Guardião se conquista);
--   • motivo obrigatório e público (tabela reconhecimentos, visível a todos os membros);
--   • dá NÍVEL, mas não gera Dracmas (DRC só vem de contribuição verificada dentro da Ágora).

insert into public.configuracoes (chave, valor, descricao) values
  ('reconhecimento', '{"max_por_membro": 250, "max_por_vez": 250, "gera_drc": false}',
   'Pontos que a administração pode reconhecer por contribuições anteriores (sem gerar DRC)')
on conflict (chave) do nothing;

create table public.reconhecimentos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  pontos integer not null check (pontos > 0),
  motivo text not null check (length(trim(motivo)) >= 10 and length(motivo) <= 500),
  admin_id uuid not null references public.profiles (id),
  criado_em timestamptz not null default now()
);
create index reconhecimentos_profile_idx on public.reconhecimentos (profile_id);
comment on table public.reconhecimentos is 'Pontos reconhecidos pela administração por contribuições anteriores; públicos para os membros';

alter table public.reconhecimentos enable row level security;
create policy "reconhecimentos: membros leem" on public.reconhecimentos for select to authenticated using (public.pode_ler());
revoke insert, update, delete, truncate on public.reconhecimentos from anon, authenticated;
grant select on public.reconhecimentos to authenticated;
grant all on public.reconhecimentos to service_role;
create trigger reconhecimentos_imutavel before update or delete on public.reconhecimentos
  for each row execute function public.bloquear_alteracao();

create or replace function public.reconhecer_contribuicao(p_profile uuid, p_pontos integer, p_motivo text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_cfg jsonb := public.config('reconhecimento');
  v_max integer := coalesce((v_cfg ->> 'max_por_membro')::int, 250);
  v_max_vez integer := coalesce((v_cfg ->> 'max_por_vez')::int, 250);
  v_ja integer;
  v_id uuid;
begin
  if not public.eh_admin() then raise exception 'Só a administração reconhece contribuições' using errcode = '42501'; end if;
  if p_profile = auth.uid() then raise exception 'Ninguém reconhece a si mesmo' using errcode = '42501'; end if;
  if p_pontos is null or p_pontos < 1 or p_pontos > v_max_vez then raise exception 'Pontos entre 1 e %', v_max_vez; end if;
  if length(trim(coalesce(p_motivo, ''))) < 10 then raise exception 'Explique o motivo (pelo menos 10 caracteres)'; end if;
  select coalesce(sum(pontos), 0) into v_ja from public.reconhecimentos where profile_id = p_profile;
  if v_ja + p_pontos > v_max then
    raise exception 'Limite de % pontos reconhecidos por pessoa (já tem %). O resto se conquista contribuindo.', v_max, v_ja;
  end if;
  insert into public.reconhecimentos (profile_id, pontos, motivo, admin_id)
  values (p_profile, p_pontos, trim(p_motivo), auth.uid()) returning id into v_id;
  insert into public.reputacao_eventos (profile_id, acao, pontos, referencia_tipo, referencia_id)
  values (p_profile, 'contribuicao_historica', p_pontos, 'reconhecimento', v_id);
  perform public.notificar(p_profile, 'reconhecimento', 'Suas contribuições foram reconhecidas',
    '+' || p_pontos || ' pontos de reputação: ' || left(trim(p_motivo), 120), '/perfil', 'reconhecimento:' || v_id);
  return p_pontos;
end $$;
revoke execute on function public.reconhecer_contribuicao(uuid, integer, text) from public, anon;
grant execute on function public.reconhecer_contribuicao(uuid, integer, text) to authenticated;

-- Pontos reconhecidos dão nível, mas não Dracmas (a menos que a configuração diga o contrário)
create or replace function public.creditar_drc_pendente() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_taxa numeric := public.config_num('drc', 'taxa_conversao', 1);
begin
  if new.acao = 'contribuicao_historica'
     and coalesce((public.config('reconhecimento') ->> 'gera_drc')::boolean, false) = false then
    return new;
  end if;
  -- Pontos positivos geram crédito; negativos reduzem créditos pendentes.
  insert into public.drc_pendentes (profile_id, reputacao_evento_id, valor)
  values (new.profile_id, new.id, new.pontos * v_taxa);
  return new;
end $$;
