-- ============================================================================
-- Ágora · 009 · Row Level Security em TODAS as tabelas
-- Regra geral: membro inativo não lê conteúdo da comunidade (pode_ler()).
-- As regras finas de cada transição ficam nos triggers de validação.
-- ============================================================================

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Privilégios de tabela (o Supabase já concede por padrão; explícito para CI)
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;
-- funções internas continuam revogadas (os revokes vêm depois deste grant)
revoke execute on function public.notificar(uuid, text, text, text, text, text) from authenticated;
revoke execute on function public.recalcular_reputacao(uuid) from authenticated;
revoke execute on function public.registrar_reputacao(uuid, text, text, uuid, numeric, boolean) from authenticated;
revoke execute on function public.estornar_reputacao(uuid, text, uuid) from authenticated;
revoke execute on function public.apurar_proposta(uuid) from authenticated;
revoke execute on function public.assembleia_tick() from authenticated;
revoke execute on function public.eventos_tick() from authenticated;
revoke execute on function public.ocultar_item(public.tipo_item_moderavel, uuid) from authenticated;
revoke execute on function public.anonimizar_conta(uuid) from authenticated;
revoke execute on function public.preparar_epoca(integer, timestamptz, timestamptz) from authenticated;
revoke execute on function public.registrar_provas_epoca(integer, text, jsonb) from authenticated;

-- ---------------------------------------------------------------- configurações, temas, núcleos
create policy "config: leitura logado" on public.configuracoes for select to authenticated using (true);
create policy "config: admin escreve" on public.configuracoes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "temas: leitura logado" on public.temas for select to authenticated using (true);
create policy "temas: admin escreve" on public.temas for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "nucleos: leitura logado" on public.nucleos for select to authenticated using (true);
create policy "nucleos: admin cria" on public.nucleos for insert to authenticated with check (public.eh_admin());
create policy "nucleos: admin ou coordenação edita" on public.nucleos for update to authenticated
  using (public.coordena_nucleo(id)) with check (public.coordena_nucleo(id));
create policy "nucleos: admin exclui" on public.nucleos for delete to authenticated using (public.eh_admin());

-- ---------------------------------------------------------------- perfis
create policy "profiles: o próprio ou admin lê" on public.profiles for select to authenticated
  using (id = auth.uid() or public.eh_admin());
create policy "profiles: o próprio ou admin edita" on public.profiles for update to authenticated
  using (id = auth.uid() or public.eh_admin()) with check (id = auth.uid() or public.eh_admin());

-- ---------------------------------------------------------------- tópicos e respostas
create policy "topicos: membros leem" on public.topicos for select to authenticated
  using (public.pode_ler() and (excluido_em is null or public.eh_admin()));
create policy "topicos: colaboradores criam" on public.topicos for insert to authenticated
  with check (public.tem_nivel(2) and autor_id = auth.uid());
create policy "topicos: autor ou moderação edita" on public.topicos for update to authenticated
  using (public.pode_escrever() and (autor_id = auth.uid() or public.eh_moderador()))
  with check (public.pode_escrever());

create policy "respostas: membros leem" on public.respostas for select to authenticated using (public.pode_ler());
create policy "respostas: membros respondem" on public.respostas for insert to authenticated
  with check (public.pode_escrever() and autor_id = auth.uid());
create policy "respostas: autor, dono do tópico ou moderação" on public.respostas for update to authenticated
  using (public.pode_escrever() and (autor_id = auth.uid() or public.eh_moderador()
         or exists (select 1 from public.topicos t where t.id = topico_id and t.autor_id = auth.uid())))
  with check (public.pode_escrever());

-- ---------------------------------------------------------------- artigos
create policy "artigos: leitura por status e papel" on public.artigos
  for select to authenticated using (
    public.eh_admin()
    or public.eh_autor_artigo(id)
    or (public.pode_ler() and status = 'publicado' and excluido_em is null)
    or (status = 'em_revisao' and public.tem_nivel(3))
  );
create policy "artigos: colaboradores propõem" on public.artigos for insert to authenticated
  with check (public.tem_nivel(2) and criado_por = auth.uid());
create policy "artigos: autores editam" on public.artigos for update to authenticated
  using (public.pode_escrever() and (public.eh_autor_artigo(id) or public.eh_admin()))
  with check (public.pode_escrever());

create policy "artigo_autores: leitura" on public.artigo_autores for select to authenticated
  using (public.pode_ler() or profile_id = auth.uid());
create policy "artigo_autores: autores adicionam coautores" on public.artigo_autores for insert to authenticated
  with check (public.tem_nivel(2) and public.eh_autor_artigo(artigo_id));
create policy "artigo_autores: autores removem coautores" on public.artigo_autores for delete to authenticated
  using (public.pode_escrever() and public.eh_autor_artigo(artigo_id));

create policy "revisoes: autores, curadores ou artigo publicado" on public.revisoes for select to authenticated
  using (public.eh_autor_artigo(artigo_id) or public.tem_nivel(3) or revisor_id = auth.uid()
         or (public.pode_ler() and exists (select 1 from public.artigos a where a.id = artigo_id and a.status = 'publicado')));
create policy "revisoes: curadores revisam" on public.revisoes for insert to authenticated
  with check (public.tem_nivel(3) and revisor_id = auth.uid());

-- ---------------------------------------------------------------- trilhas
create policy "trilhas: publicadas para membros; rascunho para o curador" on public.trilhas for select to authenticated
  using ((public.pode_ler() and publicada and excluido_em is null) or curador_id = auth.uid() or public.eh_admin());
create policy "trilhas: curadores montam" on public.trilhas for insert to authenticated
  with check (public.tem_nivel(3) and curador_id = auth.uid());
create policy "trilhas: curador edita" on public.trilhas for update to authenticated
  using ((curador_id = auth.uid() and public.tem_nivel(3)) or public.eh_admin()) with check (public.pode_escrever());

create policy "trilha_itens: leitura" on public.trilha_itens for select to authenticated
  using (public.pode_ler() or exists (select 1 from public.trilhas t where t.id = trilha_id and t.curador_id = auth.uid()));
create policy "trilha_itens: curador escreve" on public.trilha_itens for all to authenticated
  using (exists (select 1 from public.trilhas t where t.id = trilha_id and t.curador_id = auth.uid()) and public.tem_nivel(3))
  with check (exists (select 1 from public.trilhas t where t.id = trilha_id and t.curador_id = auth.uid()) and public.tem_nivel(3));

create policy "progresso: o próprio" on public.progresso_trilha for select to authenticated using (profile_id = auth.uid());
create policy "progresso: o próprio reinicia" on public.progresso_trilha for delete to authenticated using (profile_id = auth.uid());
create policy "trilhas_concluidas: membros veem (perfil)" on public.trilhas_concluidas for select to authenticated
  using (public.pode_ler() or profile_id = auth.uid());

create policy "salvos: o próprio" on public.salvos for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and public.pode_ler());

-- ---------------------------------------------------------------- mutirão
create policy "projetos: membros leem" on public.projetos for select to authenticated
  using (public.pode_ler() and (excluido_em is null or public.eh_admin()));
create policy "projetos: guardiões criam" on public.projetos for insert to authenticated
  with check (public.tem_nivel(4) and coordenador_id = auth.uid());
create policy "projetos: coordenação edita" on public.projetos for update to authenticated
  using (public.pode_escrever() and public.coordena_projeto(id)) with check (public.pode_escrever());

create policy "projeto_membros: membros leem" on public.projeto_membros for select to authenticated using (public.pode_ler());
create policy "projeto_membros: quero ajudar ou coordenação adiciona" on public.projeto_membros for insert to authenticated
  with check (public.pode_escrever() and (
    (profile_id = auth.uid() and papel = 'voluntario') or public.coordena_projeto(projeto_id)));
create policy "projeto_membros: sair ou coordenação remove" on public.projeto_membros for delete to authenticated
  using ((profile_id = auth.uid() and papel = 'voluntario') or public.coordena_projeto(projeto_id));
create policy "projeto_membros: coordenação promove" on public.projeto_membros for update to authenticated
  using (public.coordena_projeto(projeto_id)) with check (public.coordena_projeto(projeto_id));

create policy "tarefas: membros leem" on public.tarefas for select to authenticated
  using (public.pode_ler() and excluido_em is null);
create policy "tarefas: participantes criam" on public.tarefas for insert to authenticated with check (public.pode_escrever());
create policy "tarefas: participantes atualizam" on public.tarefas for update to authenticated
  using (public.pode_escrever()) with check (public.pode_escrever());

create policy "horas: membros leem" on public.horas_voluntariado for select to authenticated using (public.pode_ler());
create policy "horas: o próprio registra" on public.horas_voluntariado for insert to authenticated
  with check (public.pode_escrever() and profile_id = auth.uid());

create policy "eventos: membros leem" on public.eventos for select to authenticated
  using (public.pode_ler() and excluido_em is null);
create policy "eventos: organização cria" on public.eventos for insert to authenticated
  with check (public.pode_organizar_evento(nucleo_id, projeto_id) and criado_por = auth.uid());
create policy "eventos: organização edita" on public.eventos for update to authenticated
  using (public.organiza_evento(id)) with check (public.pode_escrever());
-- eventos_codigos: sem políticas → inacessível ao app (só via codigo_checkin_evento/fazer_checkin)

create policy "rsvps: membros leem" on public.rsvps for select to authenticated using (public.pode_ler());
create policy "rsvps: o próprio confirma" on public.rsvps for insert to authenticated
  with check (public.pode_escrever() and profile_id = auth.uid());
create policy "rsvps: o próprio altera" on public.rsvps for update to authenticated
  using (profile_id = auth.uid()) with check (public.pode_escrever() and profile_id = auth.uid());

create policy "caixa: todo membro vê" on public.caixa_lancamentos for select to authenticated using (public.pode_ler());
create policy "caixa: coordenação lança" on public.caixa_lancamentos for insert to authenticated
  with check (public.pode_escrever() and public.coordena_projeto(projeto_id));

create policy "doacoes: doador, coordenação ou admin" on public.doacoes for select to authenticated
  using (doador_id = auth.uid() or public.coordena_projeto(projeto_id));
-- inserção e atualização de doações só pelas Edge Functions (service_role)

-- ---------------------------------------------------------------- assembleia
create or replace function public.rodada_encerrada(p_proposta uuid, p_rodada integer) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.propostas p where p.id = p_proposta
                 and (p.rodada > p_rodada or p.status in ('aprovada', 'rejeitada')))
$$;

create policy "propostas: membros leem (rascunho só o autor)" on public.propostas for select to authenticated
  using ((public.pode_ler() and status <> 'rascunho' and excluido_em is null) or autor_id = auth.uid() or public.eh_admin());
create policy "propostas: curadores propõem" on public.propostas for insert to authenticated
  with check (public.tem_nivel(3) and autor_id = auth.uid());
create policy "propostas: autor edita" on public.propostas for update to authenticated
  using (autor_id = auth.uid() and public.pode_escrever()) with check (autor_id = auth.uid());

create policy "comentarios: membros leem" on public.proposta_comentarios for select to authenticated using (public.pode_ler());
create policy "comentarios: membros comentam" on public.proposta_comentarios for insert to authenticated
  with check (public.pode_escrever() and autor_id = auth.uid());
create policy "comentarios: autor edita" on public.proposta_comentarios for update to authenticated
  using (autor_id = auth.uid() and public.pode_escrever()) with check (autor_id = auth.uid());

-- votos nominais: cada um vê o seu; todos veem após o encerramento; bloqueios são públicos
create policy "votos: o próprio, bloqueios ou após encerramento" on public.votos for select to authenticated
  using (profile_id = auth.uid()
         or (public.pode_ler() and (voto = 'bloqueio' or public.rodada_encerrada(proposta_id, rodada))));
create policy "votos: o próprio vota" on public.votos for insert to authenticated
  with check (public.pode_escrever() and profile_id = auth.uid());
create policy "votos: o próprio muda o voto" on public.votos for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and public.pode_escrever());

create policy "decisoes: membros leem" on public.decisoes for select to authenticated using (public.pode_ler());

-- ---------------------------------------------------------------- reputação e notificações
create policy "reputacao: histórico visível no perfil" on public.reputacao_eventos for select to authenticated
  using (profile_id = auth.uid() or public.pode_ler());

create policy "notificacoes: as próprias" on public.notificacoes for select to authenticated using (profile_id = auth.uid());
create policy "notificacoes: marcar lida" on public.notificacoes for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "notificacoes: apagar" on public.notificacoes for delete to authenticated using (profile_id = auth.uid());

create policy "dispositivos: os próprios" on public.dispositivos_push for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------------------------------------------------------------- moderação
create policy "denuncias: a própria ou moderação" on public.denuncias for select to authenticated
  using (denunciante_id = auth.uid() or public.eh_moderador());
create policy "denuncias: qualquer membro denuncia" on public.denuncias for insert to authenticated
  with check (public.pode_ler() and denunciante_id = auth.uid());

create policy "log_moderacao: público para membros" on public.log_moderacao for select to authenticated using (public.pode_ler());
create policy "conteudo_oculto: só admins" on public.conteudo_oculto for select to authenticated using (public.eh_admin());

-- ---------------------------------------------------------------- on-chain (espelho público; provas só do dono)
create policy "carteiras: membros veem" on public.carteiras for select to authenticated
  using (profile_id = auth.uid() or public.pode_ler());
create policy "epocas: membros veem" on public.epocas_recompensa for select to authenticated using (public.pode_ler());
create policy "drc_pendentes: o próprio" on public.drc_pendentes for select to authenticated using (profile_id = auth.uid());
create policy "creditos_drc: só o dono (provas Merkle)" on public.creditos_drc for select to authenticated using (profile_id = auth.uid());
create policy "propostas_onchain: membros veem" on public.propostas_onchain for select to authenticated using (public.pode_ler());
create policy "votos_onchain: membros veem" on public.votos_onchain for select to authenticated using (public.pode_ler());
create policy "delegacoes: membros veem" on public.delegacoes for select to authenticated using (public.pode_ler());
create policy "movimentos_drc: membros veem" on public.movimentos_drc for select to authenticated using (public.pode_ler());
-- indexador_estado: sem políticas (só service_role)

-- ---------------------------------------------------------------- página pública (visitantes)
create or replace function public.estatisticas_publicas() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'membros_ativos', public.membros_aptos_escopo(null),
    'artigos_publicados', (select count(*) from public.artigos where status = 'publicado' and not oculto),
    'horas_voluntariado', (select coalesce(sum(horas), 0) from public.horas_voluntariado where confirmado_em is not null),
    'projetos_concluidos', (select count(*) from public.projetos where status = 'concluido'),
    'decisoes', (select count(*) from public.decisoes),
    'nucleos', (select coalesce(jsonb_agg(jsonb_build_object('cidade', cidade, 'estado', estado) order by estado, cidade), '[]')
                from public.nucleos)
  )
$$;
grant execute on function public.estatisticas_publicas() to anon, authenticated;
