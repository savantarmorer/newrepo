-- Tira do ar os dados de demonstração (seed: contas @agora.test) de um banco de verdade.
--
-- Se o seed foi carregado num projeto em produção, as contas de demonstração têm senhas
-- públicas (estão no repositório, inclusive uma de administração) e seus eventos e
-- propostas aparecem para a comunidade — e viram eventos no Discord. Esta migração:
--   • bloqueia o login dessas contas (sem senha, banidas, sessões encerradas);
--   • retira as propostas abertas e esconde eventos, tópicos, artigos, trilhas, projetos,
--     tarefas e comentários criados por elas (exclusão lógica, nada é apagado de verdade);
--   • tira essas contas da contagem de membros (quórum da Assembleia).
-- O bot do Discord remove os eventos correspondentes na sincronização seguinte (até 10 min).
-- Em banco novo (migrações antes do seed, como no `supabase db reset`) não faz nada.

do $$
declare
  v_demo uuid[];
begin
  select coalesce(array_agg(id), '{}') into v_demo from auth.users where email like '%@agora.test';
  if cardinality(v_demo) = 0 then
    raise notice 'Nenhum dado de demonstração encontrado.';
    return;
  end if;
  raise notice 'Tirando do ar % contas de demonstração e o que elas criaram.', cardinality(v_demo);

  -- Logins: sem senha, banidos e sem sessões (colunas/tabelas do Auth conferidas antes)
  if exists (select 1 from information_schema.columns where table_schema = 'auth' and table_name = 'users' and column_name = 'encrypted_password') then
    execute 'update auth.users set encrypted_password = null where id = any($1)' using v_demo;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'auth' and table_name = 'users' and column_name = 'banned_until') then
    execute $q$update auth.users set banned_until = 'infinity' where id = any($1)$q$ using v_demo;
  end if;
  if to_regclass('auth.sessions') is not null then
    execute 'delete from auth.sessions where user_id = any($1)' using v_demo;
  end if;
  if to_regclass('auth.refresh_tokens') is not null then
    execute 'delete from auth.refresh_tokens where user_id::text = any($1::text[])' using v_demo;
  end if;

  -- Assembleia: propostas abertas são retiradas e escondidas
  update public.propostas set status = 'retirada'
   where autor_id = any(v_demo) and status in ('rascunho', 'debate', 'votacao');
  update public.propostas set excluido_em = now(), oculto = true
   where autor_id = any(v_demo) and excluido_em is null;
  update public.proposta_comentarios set excluido_em = now() where autor_id = any(v_demo) and excluido_em is null;

  -- Eventos (e, com eles, os eventos do Discord)
  update public.eventos set excluido_em = now() where criado_por = any(v_demo) and excluido_em is null;

  -- Biblioteca e Mutirão
  update public.topicos set excluido_em = now() where autor_id = any(v_demo) and excluido_em is null;
  update public.respostas set excluido_em = now() where autor_id = any(v_demo) and excluido_em is null;
  update public.artigos set excluido_em = now() where criado_por = any(v_demo) and excluido_em is null;
  update public.trilhas set excluido_em = now() where curador_id = any(v_demo) and excluido_em is null;
  update public.projetos set excluido_em = now() where coordenador_id = any(v_demo) and excluido_em is null;
  update public.tarefas set excluido_em = now() where criado_por = any(v_demo) and excluido_em is null;

  -- As contas saem da comunidade (não contam para quórum nem aparecem como membros)
  update public.profiles set excluido_em = now(), status_assinatura = 'inativo'
   where id = any(v_demo) and excluido_em is null;
end $$;
