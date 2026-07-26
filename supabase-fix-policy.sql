-- =====================================================================
-- AMOQ — Correção de políticas RLS (execute se já rodou supabase-migration.sql)
-- Adiciona a policy INSERT que estava faltando em document_views.
-- =====================================================================

-- Adiciona policy de INSERT para document_views (faltava na migração original)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'document_views'
      AND policyname = 'views_insert_own'
  ) THEN
    CREATE POLICY "views_insert_own"
      ON public.document_views FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Confirma que as policies estão corretas
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'document_views';
