-- =====================================================================
-- AMOQ — Migração Supabase
-- Execute no SQL Editor do Supabase Dashboard (Settings → SQL Editor)
-- =====================================================================

-- 1. Tabela de perfis AMOQ (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp          INTEGER NOT NULL DEFAULT 0,
  grau        INTEGER NOT NULL DEFAULT 1,
  demon_num   INTEGER,           -- 1-72 (Ars Goetia)
  demon_nome  TEXT,
  demon_rank  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de visualizações de documentos / XP
CREATE TABLE IF NOT EXISTS public.document_views (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id    TEXT NOT NULL,    -- ID do Google Drive
  document_name  TEXT,
  document_tema  TEXT,
  xp_earned      INTEGER NOT NULL DEFAULT 10,
  viewed_at      TIMESTAMPTZ DEFAULT now()
);

-- Garante XP único por usuário+documento (sem XP duplo)
CREATE UNIQUE INDEX IF NOT EXISTS doc_views_unique
  ON public.document_views (user_id, document_id);

-- ── Row Level Security ───────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_views ENABLE ROW LEVEL SECURITY;

-- Usuários leem e atualizam apenas o próprio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Usuários leem e inserem as próprias visualizações
CREATE POLICY "views_select_own"
  ON public.document_views FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "views_insert_own"
  ON public.document_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Trigger: cria perfil automaticamente ao registrar ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demon_index INTEGER;
BEGIN
  -- Atribui demônio deterministicamente pelo UUID do usuário
  demon_index := (abs(hashtext(NEW.id::text)) % 72) + 1;

  INSERT INTO public.profiles (id, xp, grau, demon_num)
  VALUES (NEW.id, 0, 1, demon_index)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── Verificar criação ────────────────────────────────────────────────
-- SELECT * FROM public.profiles LIMIT 5;
-- SELECT * FROM public.document_views LIMIT 5;
