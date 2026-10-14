-- ============================================================================
-- Ágora · 010 · Storage (buckets e políticas) e funções agendadas (pg_cron)
-- ============================================================================

-- ---------------------------------------------------------------- buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatares', 'avatares', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('capas', 'capas', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('comprovantes', 'comprovantes', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- avatares/<uid>/arquivo
create policy "avatares: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatares: dono substitui" on storage.objects for update to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatares: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

-- capas/<uid>/arquivo (artigos, trilhas, projetos)
create policy "capas: membros ativos enviam" on storage.objects for insert to authenticated
  with check (bucket_id = 'capas' and public.pode_escrever() and (storage.foldername(name))[1] = auth.uid()::text);

-- comprovantes/<projeto_id>/arquivo — bucket PRIVADO; leitura por URL assinada
create or replace function public.uuid_ou_nulo(p text) returns uuid language plpgsql immutable as $$
begin
  return p::uuid;
exception when others then
  return null;
end $$;

create policy "comprovantes: coordenação envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovantes' and public.pode_escrever()
              and public.coordena_projeto(public.uuid_ou_nulo((storage.foldername(name))[1])));
create policy "comprovantes: membros ativos leem (URL assinada)" on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes' and public.pode_ler());

-- ---------------------------------------------------------------- agendamentos
-- Em projetos Supabase, habilite as extensões pg_cron e pg_net (Dashboard →
-- Database → Extensions) e guarde no Vault:
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service_role_key>', 'service_role_key');
-- Os jobs SQL puros rodam direto; os que chamam Edge Functions usam pg_net.
create or replace function public.chamar_edge_function(p_nome text, p_corpo jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_url text; v_chave text;
begin
  execute $q$select decrypted_secret from vault.decrypted_secrets where name = 'project_url'$q$ into v_url;
  execute $q$select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'$q$ into v_chave;
  if v_url is null or v_chave is null then
    raise warning 'Segredos project_url/service_role_key ausentes no Vault; % não foi chamada', p_nome;
    return;
  end if;
  execute 'select net.http_post(url := $1, headers := $2, body := $3)'
    using v_url || '/functions/v1/' || p_nome,
          jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_chave),
          p_corpo;
end $$;
revoke execute on function public.chamar_edge_function(text, jsonb) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    -- ciclo da Assembleia: a cada 5 minutos
    perform cron.schedule('agora-assembleia', '*/5 * * * *', 'select public.assembleia_tick()');
    -- lembretes de eventos: de hora em hora
    perform cron.schedule('agora-eventos', '7 * * * *', 'select public.eventos_tick()');
    -- push das notificações: a cada minuto
    perform cron.schedule('agora-push', '* * * * *', $c$select public.chamar_edge_function('enviar-push')$c$);
    -- indexador on-chain: a cada 2 minutos
    perform cron.schedule('agora-indexador', '*/2 * * * *', $c$select public.chamar_edge_function('indexador-chain')$c$);
    -- níveis do SBT: a cada 15 minutos
    perform cron.schedule('agora-sbt', '*/15 * * * *', $c$select public.chamar_edge_function('sincronizar-sbt')$c$);
    -- fechamento semanal da época de recompensas: segunda-feira 03:10 (UTC)
    perform cron.schedule('agora-epoca', '10 3 * * 1', $c$select public.chamar_edge_function('fechar-epoca')$c$);
  else
    raise notice 'pg_cron indisponível neste banco: agende assembleia_tick() e eventos_tick() externamente.';
  end if;
end $$;
