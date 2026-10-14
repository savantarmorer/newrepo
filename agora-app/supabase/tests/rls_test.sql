-- ============================================================================
-- Testes das políticas RLS e regras de negócio principais.
-- Rode após migrations + seed. Tudo acontece numa transação desfeita no final.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- Num projeto Supabase, use a connection string do usuário postgres.
-- Cada falha interrompe o script com "FALHA: ...".
-- ============================================================================
begin;

create function pg_temp.u(n integer) returns uuid language sql immutable as
  $$ select ('a0000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;
create function pg_temp.id(prefixo text, n integer) returns uuid language sql immutable as
  $$ select (prefixo || '0000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;

-- troca de identidade como o PostgREST faria
create function pg_temp.como(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p::text, ''), true);
  perform set_config('request.jwt.claim.role', case when p is null then 'anon' else 'authenticated' end, true);
  if p is null then set local role anon; else set local role authenticated; end if;
end $$;
create function pg_temp.verifica(p_ok boolean, p_desc text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FALHA: %', p_desc; end if;
  raise notice 'ok — %', p_desc;
end $$;
create function pg_temp.deve_falhar(p_sql text, p_desc text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok — % (bloqueado: %)', p_desc, sqlerrm;
    return;
  end;
  raise exception 'FALHA: % — o comando deveria ter sido bloqueado', p_desc;
end $$;
-- RLS costuma "filtrar" (0 linhas afetadas) em vez de dar erro: verifica que nada mudou
create function pg_temp.sem_efeito(p_sql text, p_estado text, p_desc text) returns void language plpgsql as $$
declare antes text; depois text;
begin
  execute p_estado into antes;
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok — % (bloqueado: %)', p_desc, sqlerrm;
    return;
  end;
  execute p_estado into depois;
  if antes is distinct from depois then raise exception 'FALHA: % — o estado mudou', p_desc; end if;
  raise notice 'ok — % (filtrado pela RLS)', p_desc;
end $$;
create function pg_temp.conta(p_sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || p_sql || ') x' into n;
  return n;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated;

-- ---------------------------------------------------------------- 1. visitante
select pg_temp.como(null);
select pg_temp.verifica(pg_temp.conta('select * from public.topicos') = 0, 'visitante não lê tópicos');
select pg_temp.verifica(pg_temp.conta('select * from public.artigos') = 0, 'visitante não lê artigos');
select pg_temp.verifica((public.estatisticas_publicas() ->> 'membros_ativos')::int > 0, 'visitante vê estatísticas públicas');
reset role;

-- ---------------------------------------------------------------- 2. membro inativo
select pg_temp.como(pg_temp.u(19));
select pg_temp.verifica(pg_temp.conta('select * from public.topicos') = 0, 'membro inativo não lê tópicos');
select pg_temp.verifica(pg_temp.conta('select * from public.artigos') = 0, 'membro inativo não lê artigos');
select pg_temp.verifica(pg_temp.conta('select * from public.caixa_lancamentos') = 0, 'membro inativo não lê o caixa');
select pg_temp.verifica(pg_temp.conta('select * from public.profiles where id = auth.uid()') = 1, 'membro inativo vê o próprio perfil');
select pg_temp.verifica(pg_temp.conta('select * from public.configuracoes where chave = ''assinatura''') = 1, 'membro inativo lê o link de reativação');
select pg_temp.deve_falhar($$insert into public.votos (proposta_id, profile_id, voto) values ('20000000-0000-4000-8000-000000000004', auth.uid(), 'favor')$$,
  'membro inativo não vota');
reset role;

-- ---------------------------------------------------------------- 3. leitura e privacidade do membro ativo
select pg_temp.como(pg_temp.u(2));
select pg_temp.verifica(pg_temp.conta('select * from public.topicos') = 15, 'membro ativo lê os 15 tópicos');
select pg_temp.verifica(pg_temp.conta('select * from public.artigos where status = ''publicado''') = 8, 'membro ativo lê os 8 artigos publicados');
select pg_temp.verifica(pg_temp.conta('select * from public.artigos where status = ''em_revisao''') = 0, 'aprendiz/colaborador não vê fila de revisão');
select pg_temp.verifica(pg_temp.conta('select * from public.profiles') = 1, 'tabela profiles só mostra o próprio perfil');
select pg_temp.verifica((select nome_publico from public.perfis_publicos where id = pg_temp.u(5)) = 'Corvo Branco', 'pseudônimo é o nome público');
select pg_temp.verifica(pg_temp.conta($$select * from public.perfis_publicos where nome_publico ilike '%Rafael%'$$) = 0, 'nome real de quem usa pseudônimo não aparece');
select pg_temp.verifica(pg_temp.conta('select * from public.notificacoes where profile_id <> auth.uid()') = 0, 'não lê notificações alheias');
select pg_temp.verifica(pg_temp.conta('select * from public.creditos_drc') = 1, 'vê só os próprios créditos/provas Merkle');
select pg_temp.verifica(pg_temp.conta('select * from public.eventos_codigos') = 0, 'códigos de check-in são inacessíveis');
select pg_temp.verifica(pg_temp.conta('select * from public.conteudo_oculto') = 0, 'conteúdo oculto só para admins');
select pg_temp.verifica(pg_temp.conta('select * from public.caixa_lancamentos') > 0, 'todo membro vê o caixa');
select pg_temp.deve_falhar($$update public.profiles set papel = 'admin' where id = auth.uid()$$, 'membro não se promove a admin');
select pg_temp.deve_falhar($$update public.profiles set reputacao_total = 9999 where id = auth.uid()$$, 'membro não altera a própria reputação');
select pg_temp.deve_falhar($$select public.codigo_checkin_evento('10000000-0000-4000-8000-000000000003')$$, 'membro comum não vê o QR do evento');
select pg_temp.deve_falhar($$insert into public.reputacao_eventos (profile_id, acao, pontos) values (auth.uid(), 'trapaça', 1000)$$, 'cliente não gera pontos');
-- votos de outros ficam ocultos durante a votação (bloqueios são públicos)
select pg_temp.verifica(pg_temp.conta($$select * from public.votos where proposta_id = '20000000-0000-4000-8000-000000000004' and profile_id <> auth.uid() and voto <> 'bloqueio'$$) = 0,
  'votos alheios ocultos durante a votação');
select pg_temp.verifica(pg_temp.conta($$select * from public.votos where proposta_id = '20000000-0000-4000-8000-000000000001'$$) = 14,
  'votos nominais visíveis após o encerramento');
reset role;

-- ---------------------------------------------------------------- 4. permissões por nível
select pg_temp.como(pg_temp.u(15)); -- Aprendiz
select pg_temp.deve_falhar($$insert into public.topicos (tema_id, autor_id, titulo, corpo_md) select id, auth.uid(), 'Tópico de aprendiz', 'texto' from public.temas limit 1$$,
  'Aprendiz (nível 1) não cria tópico');
insert into public.respostas (topico_id, autor_id, corpo_md) values (pg_temp.id('c', 1), pg_temp.u(15), 'Aprendiz pode responder.');
select pg_temp.verifica(true, 'Aprendiz responde tópicos');
select pg_temp.deve_falhar($$insert into public.propostas (autor_id, titulo, proposta_md) values (auth.uid(), 'Proposta de aprendiz', 'x')$$,
  'Aprendiz não abre proposta');
reset role;

select pg_temp.como(pg_temp.u(2)); -- Colaborador
insert into public.topicos (tema_id, autor_id, titulo, corpo_md)
  select id, pg_temp.u(2), 'Tópico de colaborador', 'Corpo do tópico' from public.temas where slug = 'filosofia';
select pg_temp.verifica(true, 'Colaborador (nível 2) cria tópico');
do $$
declare v_id uuid;
begin
  -- INSERT ... RETURNING: o rascunho precisa ser visível a quem o criou (autoria entra por gatilho AFTER)
  insert into public.artigos (tema_id, criado_por, titulo, corpo_md)
    select id, auth.uid(), 'Rascunho de colaborador', 'Texto do rascunho' from public.temas where slug = 'filosofia'
    returning id into v_id;
  perform pg_temp.verifica(v_id is not null, 'Colaborador cria rascunho de artigo e o vê no retorno');
end $$;
select pg_temp.deve_falhar($$insert into public.projetos (titulo, causa, coordenador_id) values ('Projeto sem nível', 'Teste', auth.uid())$$,
  'Colaborador não cria projeto (exige Guardião)');
select pg_temp.deve_falhar($$insert into public.revisoes (artigo_id, revisor_id, rodada, parecer, comentario) values ('d0000000-0000-4000-8000-000000000010', auth.uid(), 1, 'aprovar', 'quero revisar')$$,
  'Colaborador não revisa artigos');
select pg_temp.sem_efeito($$update public.respostas set marcada_como_util = true where id = '50000000-0000-4000-8000-000000000003'$$,
  $$select marcada_como_util::text from public.respostas where id = '50000000-0000-4000-8000-000000000003'$$,
  'só o autor do tópico marca resposta útil');
reset role;

-- ---------------------------------------------------------------- 5. revisão por pares
select pg_temp.como(pg_temp.u(6)); -- curadora e autora do artigo 9
select pg_temp.deve_falhar($$insert into public.revisoes (artigo_id, revisor_id, rodada, parecer, comentario) values ('d0000000-0000-4000-8000-000000000009', auth.uid(), 1, 'aprovar', 'meu próprio artigo')$$,
  'ninguém revisa o próprio artigo');
reset role;
select pg_temp.como(pg_temp.u(9)); -- curadora
insert into public.revisoes (artigo_id, revisor_id, rodada, parecer, comentario)
values (pg_temp.id('d', 9), pg_temp.u(9), 1, 'aprovar', 'Guia claro e muito útil. Aprovo.');
reset role;
select pg_temp.verifica((select status from public.artigos where id = pg_temp.id('d', 9)) = 'publicado', 'segunda aprovação publica o artigo');
select pg_temp.verifica((select count(*) from public.reputacao_eventos where acao = 'artigo_publicado' and referencia_id = pg_temp.id('d', 9)) = 1,
  'publicação gera pontos para a autora');

-- ---------------------------------------------------------------- 6. caixa append-only
select pg_temp.como(pg_temp.u(4)); -- coordenador Guardião
insert into public.caixa_lancamentos (projeto_id, tipo, valor, descricao, categoria)
values (pg_temp.id('f', 1), 'saida', 42.00, 'Fita adesiva para caixas', 'Materiais');
select pg_temp.verifica(true, 'coordenação lança no caixa');
select pg_temp.sem_efeito($$update public.caixa_lancamentos set valor = 1 where projeto_id = 'f0000000-0000-4000-8000-000000000001'$$,
  $$select sum(valor)::text from public.caixa_lancamentos$$, 'lançamento não pode ser editado');
select pg_temp.sem_efeito($$delete from public.caixa_lancamentos where projeto_id = 'f0000000-0000-4000-8000-000000000001'$$,
  $$select count(*)::text from public.caixa_lancamentos$$, 'lançamento não pode ser apagado');
select pg_temp.deve_falhar($$insert into public.caixa_lancamentos (projeto_id, tipo, valor, descricao, categoria, estorno_de) select projeto_id, 'entrada', 1, 'estorno curto', 'x', id from public.caixa_lancamentos where descricao = 'Fita adesiva para caixas'$$,
  'estorno exige mesmo valor e justificativa');
reset role;
select pg_temp.como(pg_temp.u(13)); -- voluntária sem coordenação
select pg_temp.deve_falhar($$insert into public.caixa_lancamentos (projeto_id, tipo, valor, descricao, categoria) values ('f0000000-0000-4000-8000-000000000001', 'saida', 10, 'Gasto não autorizado', 'x')$$,
  'quem não coordena não lança no caixa');
reset role;
select pg_temp.como(pg_temp.u(1)); -- admin
select pg_temp.sem_efeito($$update public.decisoes set resultado = 'aprovada'$$,
  $$select string_agg(resultado::text, ',' order by id) from public.decisoes$$, 'nem admins alteram decisões');
reset role;
select pg_temp.deve_falhar($$update public.decisoes set resultado = 'aprovada'$$, 'decisões são imutáveis até para o dono do banco');
reset role;

-- ---------------------------------------------------------------- 7. horas de voluntariado
select pg_temp.como(pg_temp.u(18));
insert into public.horas_voluntariado (profile_id, projeto_id, horas, descricao) values (pg_temp.u(18), pg_temp.id('f', 1), 2, 'Teste de registro de horas');
select pg_temp.deve_falhar($$select public.confirmar_horas(id) from public.horas_voluntariado where descricao = 'Teste de registro de horas'$$,
  'voluntária não confirma as próprias horas');
reset role;
select pg_temp.como(pg_temp.u(4));
select public.confirmar_horas(id) from public.horas_voluntariado where descricao = 'Teste de registro de horas';
reset role;
select pg_temp.verifica((select pontos from public.reputacao_eventos where acao = 'hora_voluntariado' order by criado_em desc limit 1) = 16,
  'horas confirmadas geram 8 pontos por hora');

-- coordenação não confirma as próprias horas
select pg_temp.como(pg_temp.u(4));
insert into public.horas_voluntariado (profile_id, projeto_id, horas, descricao) values (pg_temp.u(4), pg_temp.id('f', 1), 3, 'Horas do coordenador');
select pg_temp.deve_falhar($$select public.confirmar_horas(id) from public.horas_voluntariado where descricao = 'Horas do coordenador'$$,
  'coordenação não confirma as próprias horas');
reset role;

-- ---------------------------------------------------------------- 8. votação
select pg_temp.como(pg_temp.u(2));
select pg_temp.deve_falhar($$insert into public.votos (proposta_id, profile_id, voto, justificativa) values ('20000000-0000-4000-8000-000000000004', auth.uid(), 'bloqueio', 'curto')$$,
  'bloqueio exige justificativa de 200+ caracteres');
insert into public.votos (proposta_id, profile_id, voto, peso) values (pg_temp.id('2', 4), pg_temp.u(2), 'favor', 1);
update public.votos set voto = 'contra' where proposta_id = pg_temp.id('2', 4) and profile_id = pg_temp.u(2);
select pg_temp.verifica((select voto from public.votos where proposta_id = pg_temp.id('2', 4) and profile_id = pg_temp.u(2)) = 'contra',
  'voto pode ser alterado durante a votação');
select pg_temp.deve_falhar($$insert into public.votos (proposta_id, profile_id, voto) values ('20000000-0000-4000-8000-000000000005', auth.uid(), 'favor')$$,
  'não vota em proposta que está em debate');
select pg_temp.sem_efeito($$update public.propostas set status = 'aprovada' where id = '20000000-0000-4000-8000-000000000006'$$,
  $$select status::text from public.propostas where id = '20000000-0000-4000-8000-000000000006'$$,
  'quem não é autor não mexe na proposta');
reset role;
select pg_temp.como(pg_temp.u(9));
select pg_temp.deve_falhar($$update public.propostas set status = 'aprovada' where id = '20000000-0000-4000-8000-000000000006'$$,
  'nem o autor aprova a própria proposta');
reset role;

-- ---------------------------------------------------------------- 9. moderação
select pg_temp.como(pg_temp.u(15));
select pg_temp.verifica(pg_temp.conta('select * from public.denuncias') = 0, 'denúncias alheias não são visíveis');
select pg_temp.deve_falhar($$select public.resolver_denuncia(gen_random_uuid(), 'ocultar', 'tentativa de aprendiz')$$,
  'aprendiz não modera');
insert into public.denuncias (denunciante_id, tipo_item, item_id, motivo) values (pg_temp.u(15), 'resposta', pg_temp.id('5', 3), 'Teste de denúncia feita por aprendiz.');
select pg_temp.verifica(true, 'qualquer membro denuncia');
reset role;
select pg_temp.como(pg_temp.u(3)); -- Guardiã
select public.resolver_denuncia(id, 'ocultar', 'Resposta vazia, sem contribuição (item 3 do Código).')
  from public.denuncias where item_id = pg_temp.id('5', 18) and status = 'aberta';
reset role;
select pg_temp.verifica((select oculto and corpo_md = '' from public.respostas where id = pg_temp.id('5', 18)), 'conteúdo ocultado vira "removido pela moderação"');
select pg_temp.verifica((select count(*) from public.conteudo_oculto where item_id = pg_temp.id('5', 18)) = 1, 'original guardado para recurso');
select pg_temp.verifica((select pontos from public.reputacao_eventos where acao = 'conteudo_removido' and referencia_id = pg_temp.id('5', 18)) = -20,
  'remoção custa 20 pontos');
select pg_temp.como(pg_temp.u(17));
select pg_temp.verifica(pg_temp.conta($$select * from public.log_moderacao_publico where item_id = '50000000-0000-4000-8000-000000000018'$$) = 1,
  'log de moderação é público para membros');
reset role;
select pg_temp.como(pg_temp.u(1));
select pg_temp.verifica(pg_temp.conta('select * from public.conteudo_oculto') >= 1, 'admins acessam conteúdo oculto');
reset role;

-- ---------------------------------------------------------------- 10. suspensão
update public.profiles set suspenso_ate = now() + interval '3 days' where id = pg_temp.u(17);
select pg_temp.como(pg_temp.u(17));
select pg_temp.verifica(pg_temp.conta('select * from public.topicos') > 0, 'suspenso continua lendo');
select pg_temp.deve_falhar($$insert into public.respostas (topico_id, autor_id, corpo_md) values ('c0000000-0000-4000-8000-000000000001', auth.uid(), 'oi')$$,
  'suspenso não escreve');
reset role;

-- ---------------------------------------------------------------- 11. busca respeita RLS
select pg_temp.como(pg_temp.u(2));
select pg_temp.verifica(pg_temp.conta($$select * from public.buscar('heraclito')$$) >= 1, 'busca full-text em português (sem acento)');
reset role;
select pg_temp.como(pg_temp.u(19));
select pg_temp.verifica(pg_temp.conta($$select * from public.buscar('heraclito')$$) = 0, 'busca não vaza conteúdo para inativos');
reset role;

-- ---------------------------------------------------------------- 12. época de recompensas
select pg_temp.verifica((select count(*) from public.preparar_epoca(2, now() - interval '7 days', now() + interval '1 minute')) >= 1,
  'fechamento de época gera créditos para elegíveis');
select pg_temp.verifica(not exists (select 1 from public.creditos_drc c join public.profiles p on p.id = c.profile_id
                                     where c.epoca_id = 2 and p.status_assinatura <> 'ativo'), 'inativos não recebem DRC');
select pg_temp.verifica(not exists (select 1 from public.creditos_drc c where c.epoca_id = 2 and c.valor > 2000), 'teto por carteira respeitado');

-- ---------------------------------------------------------------- 13. LGPD
select pg_temp.como(pg_temp.u(20));
select pg_temp.verifica((public.exportar_meus_dados() -> 'perfil' ->> 'id')::uuid = pg_temp.u(20), 'exportação de dados do próprio usuário');
select public.excluir_minha_conta();
reset role;
select pg_temp.verifica((select nome_publico from public.perfis_publicos p where p.id = pg_temp.u(20)) is null
                        or (select public.nome_publico(pg_temp.u(20))) = 'Membro removido', 'conta excluída vira "Membro removido"');
select pg_temp.verifica((select count(*) from public.horas_voluntariado where profile_id = pg_temp.u(20)) = 1, 'registros históricos preservados');

-- ---------------------------------------------------------------- 14. ciclo automático da Assembleia (cron)
update public.propostas set debate_ate = now() - interval '1 minute' where id = pg_temp.id('2', 5);
update public.propostas set votacao_ate = now() - interval '1 minute' where id = pg_temp.id('2', 4);
select public.assembleia_tick();
select pg_temp.verifica((select status from public.propostas where id = pg_temp.id('2', 5)) = 'votacao', 'debate vencido abre a votação');
select pg_temp.verifica((select membros_aptos from public.propostas where id = pg_temp.id('2', 5)) > 0, 'snapshot dos membros aptos do núcleo');
select pg_temp.verifica((select status from public.propostas where id = pg_temp.id('2', 4)) in ('aprovada', 'rejeitada'), 'votação vencida é apurada');
select pg_temp.verifica(exists (select 1 from public.decisoes where proposta_id = pg_temp.id('2', 4)), 'decisão registrada');
select pg_temp.verifica((select status from public.propostas where id = pg_temp.id('2', 7)) = 'votacao', 'propostas on-chain não são apuradas off-chain');

-- ---------------------------------------------------------------- 15. acervo (índice do Drive) e tabelas do bot
insert into public.acervo_documentos (id, nome, titulo, tipo, mime, categoria, colecao, caminho, assunto, tamanho)
values ('teste-rls-1', 'Tarô de Marselha.pdf', 'Tarô de Marselha', 'pdf', 'application/pdf', 'Tradições Místicas', 'Tarô', '{Tarô}', 'Artes Divinatórias', 1000),
       ('teste-rls-2', 'Liber_AL.pdf', 'Liber AL', 'pdf', 'application/pdf', 'Tradições Místicas', 'Thelema', '{Thelema}', 'Thelema e Crowley', 2000);
select pg_temp.como(pg_temp.u(2));
select pg_temp.verifica(pg_temp.conta($$select * from public.buscar_acervo('taro')$$) = 1, 'acervo: busca sem acento acha "Tarô"');
select pg_temp.verifica(pg_temp.conta($$select * from public.buscar_acervo('liber a')$$) = 1, 'acervo: busca por trecho do título');
select pg_temp.verifica(pg_temp.conta($$select * from public.buscar_acervo(null, 'Tradições Místicas', 'Thelema')$$) = 1, 'acervo: filtro por categoria e coleção');
select pg_temp.verifica(pg_temp.conta($$select * from public.acervo_resumo() where nome = 'Tarô'$$) = 1, 'acervo: resumo por coleção');
select pg_temp.deve_falhar($$insert into public.acervo_documentos (id, nome, titulo, tipo, mime, categoria) values ('x', 'x', 'x', 'pdf', 'x', 'x')$$,
  'acervo: membro não escreve no índice');
select pg_temp.deve_falhar($$select * from public.discord_vinculos$$, 'vínculos do Discord são só do bot');
select pg_temp.deve_falhar($$select * from public.discord_eventos$$, 'eventos do Discord são só do bot');
reset role;
select pg_temp.como(pg_temp.u(19));
select pg_temp.verifica(pg_temp.conta($$select * from public.buscar_acervo('taro')$$) = 0, 'acervo: inativos não leem');
reset role;
select pg_temp.como(null);
select pg_temp.deve_falhar($$select * from public.buscar_acervo('taro')$$, 'acervo: anônimo não busca');
reset role;

-- ---------------------------------------------------------------- 16. aulas por voz: presença pela call, avaliação e reputação
select pg_temp.como(pg_temp.u(15)); -- Aprendiz
select pg_temp.deve_falhar($$insert into public.eventos (titulo, tipo, criado_por, inicio, fim)
  values ('Aula de aprendiz', 'aula', auth.uid(), now() + interval '1 day', now() + interval '1 day 1 hour')$$, 'aulas: nível 1 não marca aula');
reset role;
select pg_temp.como(pg_temp.u(2)); -- Colaborador dá a aula
insert into public.eventos (id, titulo, tipo, criado_por, inicio, fim, canal_voz_id)
values ('e1000000-0000-4000-8000-000000000001', 'Introdução ao hermetismo', 'aula', auth.uid(), now() - interval '70 minutes', now() - interval '5 minutes', '1514437822407381133');
select pg_temp.verifica(pg_temp.conta($$select * from public.eventos where id = 'e1000000-0000-4000-8000-000000000001'$$) = 1, 'aulas: nível 2 marca aula com canal de voz');
select pg_temp.deve_falhar($$insert into public.eventos (titulo, tipo, criado_por, inicio, fim) values ('Maratona', 'aula', auth.uid(), now() + interval '1 day', now() + interval '1 day 6 hours')$$,
  'aulas: duração máxima de 4 horas');
select pg_temp.deve_falhar($$update public.eventos set avaliacao_media = 5 where id = 'e1000000-0000-4000-8000-000000000001'$$, 'aulas: professor não mexe no resultado');
select pg_temp.deve_falhar($$insert into public.eventos (titulo, tipo, criado_por, proposta_id, inicio, fim) values ('Sessão', 'assembleia', auth.uid(), '20000000-0000-4000-8000-000000000005', now() + interval '1 day', now() + interval '1 day 1 hour')$$,
  'sessão da Assembleia exige nível 3');
reset role;
-- o bot (service_role) somou os minutos na call
insert into public.discord_vinculos (discord_id, profile_id, email_tecnico) values
  ('800000000000000002', pg_temp.u(2), 'd2@x'), ('800000000000000010', pg_temp.u(10), 'd10@x'), ('800000000000000011', pg_temp.u(11), 'd11@x'),
  ('800000000000000012', pg_temp.u(12), 'd12@x'), ('800000000000000013', pg_temp.u(13), 'd13@x');
select public.somar_minutos_voz('e1000000-0000-4000-8000-000000000001', array['800000000000000002', '800000000000000010', '800000000000000011', '800000000000000012', '800000000000000099'], 40);
select public.somar_minutos_voz('e1000000-0000-4000-8000-000000000001', array['800000000000000013'], 5);
select pg_temp.verifica(public.minutos_minimos_presenca('e1000000-0000-4000-8000-000000000001') = 30, 'presença mínima: metade da duração, até 30 min');
select pg_temp.verifica(public.confirmar_presenca_voz('e1000000-0000-4000-8000-000000000001') = 3, 'presença pela call: 3 alunos (sem o professor, sem quem ficou 5 min, sem conta não ligada)');
select pg_temp.verifica(public.confirmar_presenca_voz('e1000000-0000-4000-8000-000000000001') = 0, 'presença pela call não duplica');
select pg_temp.verifica((select count(*) from public.reputacao_eventos where acao = 'presenca_evento' and referencia_id = 'e1000000-0000-4000-8000-000000000001') = 3,
  'alunos presentes ganham pontos de presença');
select pg_temp.como(pg_temp.u(10));
select pg_temp.deve_falhar($$select * from public.presencas_voz$$, 'minutos na call são só do bot');
insert into public.avaliacoes_evento (evento_id, profile_id, nota, comentario) values ('e1000000-0000-4000-8000-000000000001', auth.uid(), 5, 'Muito clara!');
select pg_temp.verifica(pg_temp.conta('select * from public.avaliacoes_evento') = 1, 'aluno presente avalia e vê só a própria nota');
reset role;
select pg_temp.como(pg_temp.u(11));
insert into public.avaliacoes_evento (evento_id, profile_id, nota) values ('e1000000-0000-4000-8000-000000000001', auth.uid(), 5);
reset role;
select pg_temp.como(pg_temp.u(12));
insert into public.avaliacoes_evento (evento_id, profile_id, nota) values ('e1000000-0000-4000-8000-000000000001', auth.uid(), 4);
select pg_temp.verifica((select comentarios is null and total = 3 from public.resumo_avaliacoes('e1000000-0000-4000-8000-000000000001')), 'resumo: membros veem total e média, não os comentários');
reset role;
select pg_temp.como(pg_temp.u(13));
select pg_temp.deve_falhar($$insert into public.avaliacoes_evento (evento_id, profile_id, nota) values ('e1000000-0000-4000-8000-000000000001', auth.uid(), 1)$$,
  'quem ficou pouco na call não avalia');
reset role;
select pg_temp.como(pg_temp.u(2));
select pg_temp.deve_falhar($$insert into public.avaliacoes_evento (evento_id, profile_id, nota) values ('e1000000-0000-4000-8000-000000000001', auth.uid(), 5)$$,
  'professor não avalia a própria aula');
select pg_temp.verifica((select comentarios = array['Muito clara!'] and media = 4.67 from public.resumo_avaliacoes('e1000000-0000-4000-8000-000000000001')),
  'professor vê os comentários, sem autoria');
reset role;
select pg_temp.verifica(public.fechar_avaliacoes_aulas() = 0, 'avaliação só fecha depois da janela de 48 h');
update public.eventos set inicio = now() - interval '51 hours', fim = now() - interval '50 hours' where id = 'e1000000-0000-4000-8000-000000000001';
update public.profiles set created_at = now() - interval '60 days' where id in (pg_temp.u(10), pg_temp.u(11));
update public.profiles set created_at = now() where id = pg_temp.u(12);
select pg_temp.verifica(public.fechar_avaliacoes_aulas() = 1, 'janela fechada é processada');
select pg_temp.verifica(not exists (select 1 from public.reputacao_eventos where acao = 'aula_ministrada' and referencia_id = 'e1000000-0000-4000-8000-000000000001'),
  'contas com menos de 7 dias não contam: 2 avaliações válidas < 3, sem pontos');
select pg_temp.verifica((select avaliacao_total = 3 and avaliacao_media = 4.67 from public.eventos where id = 'e1000000-0000-4000-8000-000000000001'), 'resultado registrado no evento');
select pg_temp.verifica(exists (select 1 from public.notificacoes where chave_unica = 'aula-avaliada:e1000000-0000-4000-8000-000000000001'), 'professor é notificado do resultado');
-- segunda aula, com 3 avaliações válidas e média excelente
insert into public.eventos (id, titulo, tipo, criado_por, inicio, fim) values
  ('e1000000-0000-4000-8000-000000000002', 'Tarô: os arcanos maiores', 'aula', pg_temp.u(2), now() - interval '51 hours', now() - interval '50 hours');
update public.profiles set created_at = now() - interval '60 days' where id = pg_temp.u(12);
insert into public.avaliacoes_evento (evento_id, profile_id, nota) values
  ('e1000000-0000-4000-8000-000000000002', pg_temp.u(10), 5), ('e1000000-0000-4000-8000-000000000002', pg_temp.u(11), 5), ('e1000000-0000-4000-8000-000000000002', pg_temp.u(12), 4);
select public.fechar_avaliacoes_aulas();
select pg_temp.verifica((select pontos from public.reputacao_eventos where acao = 'aula_ministrada' and referencia_id = 'e1000000-0000-4000-8000-000000000002') = 30,
  'aula bem avaliada: 20 pontos ×1,5 (média ≥ 4,5) para o professor');
-- sessão da Assembleia: presença registrada, sem pontos
insert into public.eventos (id, titulo, tipo, criado_por, proposta_id, inicio, fim) values
  ('e1000000-0000-4000-8000-000000000003', 'Debate ao vivo', 'assembleia', pg_temp.u(5), pg_temp.id('2', 5), now() - interval '2 hours', now() - interval '1 hour');
insert into public.rsvps (evento_id, profile_id, status, presente, checkin_em) values ('e1000000-0000-4000-8000-000000000003', pg_temp.u(10), 'vou', true, now());
select pg_temp.verifica(not exists (select 1 from public.reputacao_eventos where referencia_id = 'e1000000-0000-4000-8000-000000000003'),
  'presença em sessão da Assembleia não vale pontos');

-- ---------------------------------------------------------------- 17. login no app com código do Discord
insert into public.codigos_login (codigo_hash, profile_id, expira_em) values
  ('hash-valido', pg_temp.u(10), now() + interval '15 minutes'), ('hash-vencido', pg_temp.u(10), now() - interval '1 minute');
select pg_temp.como(pg_temp.u(10));
select pg_temp.deve_falhar($$select * from public.codigos_login$$, 'códigos de login são só do servidor');
select pg_temp.deve_falhar($$select public.usar_codigo_login('hash-valido')$$, 'membro não consome códigos pela API');
reset role;
select pg_temp.como(null);
select pg_temp.deve_falhar($$select public.usar_codigo_login('hash-valido')$$, 'anônimo não consome códigos pela API');
reset role;
select pg_temp.verifica(public.usar_codigo_login('hash-valido') = pg_temp.u(10), 'código válido leva à conta');
select pg_temp.verifica(public.usar_codigo_login('hash-valido') is null, 'código só vale uma vez');
select pg_temp.verifica(public.usar_codigo_login('hash-vencido') is null, 'código vencido não vale');

do $$ begin raise notice '✔ Todos os testes de RLS e regras passaram'; end $$;
rollback;
