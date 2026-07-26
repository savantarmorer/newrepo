-- =====================================================================
-- AMOQ — Migração v2: Grimório Pessoal (Bookmarks)
-- Execute no SQL Editor do Supabase Dashboard após supabase-migration.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id    TEXT NOT NULL,
  document_name  TEXT,
  document_tema  TEXT,
  added_at       TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_unique
  ON public.bookmarks (user_id, document_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_own"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
