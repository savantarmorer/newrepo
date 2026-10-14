-- Realtime: o app escuta INSERTs em notificacoes (sino com contador ao vivo).
-- A publicação supabase_realtime existe em todo projeto Supabase; em Postgres puro (testes) é ignorada.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificacoes'
     ) then
    alter publication supabase_realtime add table public.notificacoes;
  end if;
end $$;
