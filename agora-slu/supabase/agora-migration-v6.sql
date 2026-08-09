-- =====================================================================
-- ÁGORA (SLU) — Migração v6
-- Painel Administrativo: dá a quem tem agora_profiles.is_admin = true
-- acesso direto (via RLS) para criar/editar/apagar conteúdo em todas as
-- tabelas geridas pelo admin.html — sem precisar de uma RPC por ação.
--
-- Execute DEPOIS de agora-migration.sql + v2.sql + v3.sql + v4.sql + v5.sql.
-- =====================================================================

-- Helper reutilizado em toda policy de admin abaixo. STABLE (não IMMUTABLE)
-- porque depende de auth.uid() e do conteúdo da tabela, que podem mudar
-- dentro da mesma transação/sessão.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM agora_profiles WHERE id = auth.uid()), false);
$$;

-- =====================================================================
-- Missões
-- =====================================================================
DROP POLICY IF EXISTS "agora_missions_admin_all" ON public.agora_missions;
CREATE POLICY "agora_missions_admin_all" ON public.agora_missions
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- =====================================================================
-- Eventos da Egrégora
-- =====================================================================
DROP POLICY IF EXISTS "agora_events_admin_all" ON public.agora_events;
CREATE POLICY "agora_events_admin_all" ON public.agora_events
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- =====================================================================
-- Calendário de Chamadas
-- =====================================================================
DROP POLICY IF EXISTS "agora_calls_admin_all" ON public.agora_calls;
CREATE POLICY "agora_calls_admin_all" ON public.agora_calls
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- =====================================================================
-- Hall das Lendas — admin vê tudo (inclusive pendentes de outros) e
-- aprova/edita/remove.
-- =====================================================================
DROP POLICY IF EXISTS "agora_hall_entries_select_admin" ON public.agora_hall_entries;
CREATE POLICY "agora_hall_entries_select_admin" ON public.agora_hall_entries
  FOR SELECT USING (is_admin_user());
DROP POLICY IF EXISTS "agora_hall_entries_admin_write" ON public.agora_hall_entries;
CREATE POLICY "agora_hall_entries_admin_write" ON public.agora_hall_entries
  FOR UPDATE USING (is_admin_user()) WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "agora_hall_entries_admin_delete" ON public.agora_hall_entries;
CREATE POLICY "agora_hall_entries_admin_delete" ON public.agora_hall_entries
  FOR DELETE USING (is_admin_user());

-- =====================================================================
-- Códice Caelestis
-- =====================================================================
DROP POLICY IF EXISTS "agora_codex_entries_admin_all" ON public.agora_codex_entries;
CREATE POLICY "agora_codex_entries_admin_all" ON public.agora_codex_entries
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "agora_codex_notes_admin_delete" ON public.agora_codex_notes;
CREATE POLICY "agora_codex_notes_admin_delete" ON public.agora_codex_notes
  FOR DELETE USING (is_admin_user());

-- =====================================================================
-- Investigações — admin edita/apaga qualquer item e nota (moderação)
-- =====================================================================
DROP POLICY IF EXISTS "agora_investigacoes_admin_write" ON public.agora_investigacoes;
CREATE POLICY "agora_investigacoes_admin_write" ON public.agora_investigacoes
  FOR UPDATE USING (is_admin_user()) WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "agora_investigacoes_admin_delete" ON public.agora_investigacoes;
CREATE POLICY "agora_investigacoes_admin_delete" ON public.agora_investigacoes
  FOR DELETE USING (is_admin_user());
DROP POLICY IF EXISTS "agora_investigacao_notas_admin_delete" ON public.agora_investigacao_notas;
CREATE POLICY "agora_investigacao_notas_admin_delete" ON public.agora_investigacao_notas
  FOR DELETE USING (is_admin_user());

-- =====================================================================
-- Ficha Pró-Vida — admin modera (edita/apaga) qualquer ficha enviada
-- =====================================================================
DROP POLICY IF EXISTS "agora_provida_fichas_admin_write" ON public.agora_provida_fichas;
CREATE POLICY "agora_provida_fichas_admin_write" ON public.agora_provida_fichas
  FOR UPDATE USING (is_admin_user()) WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "agora_provida_fichas_admin_delete" ON public.agora_provida_fichas;
CREATE POLICY "agora_provida_fichas_admin_delete" ON public.agora_provida_fichas
  FOR DELETE USING (is_admin_user());

-- =====================================================================
-- Quadro de Tarefas dos Voluntários — admin cadastra/edita/remove direto
-- (reivindicar/concluir/liberar continuam pelas RPCs de sempre)
-- =====================================================================
DROP POLICY IF EXISTS "agora_tasks_admin_all" ON public.agora_tasks;
CREATE POLICY "agora_tasks_admin_all" ON public.agora_tasks
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- =====================================================================
-- Pedidos de Associação (Ritual de Iniciação) — admin vê e move o status
-- (pendente → contatado → confirmado/cancelado)
-- =====================================================================
DROP POLICY IF EXISTS "agora_membership_requests_select_admin" ON public.agora_membership_requests;
CREATE POLICY "agora_membership_requests_select_admin" ON public.agora_membership_requests
  FOR SELECT USING (is_admin_user());
DROP POLICY IF EXISTS "agora_membership_requests_admin_write" ON public.agora_membership_requests;
CREATE POLICY "agora_membership_requests_admin_write" ON public.agora_membership_requests
  FOR UPDATE USING (is_admin_user()) WITH CHECK (is_admin_user());

-- ── Fim da migração v6 ─────────────────────────────────────────────────
-- Para criar o admin: crie um usuário de e-mail/senha em Authentication →
-- Users no Supabase Dashboard, depois rode:
--   UPDATE public.agora_profiles SET is_admin = true WHERE id = '<uuid do usuário>';
