-- =====================================================================
-- ÁGORA (SLU) — Migração v9
-- Pedidos de ingresso no "Novo Æon" (novo-aeon.html) — braço de ensino
-- da Ágora, acessível via botão dedicado no Painel do Iniciado.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v8.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.agora_aeon_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL,
  telefone    TEXT NOT NULL,
  expressao   TEXT, -- resposta livre ao "exercício Noemático" descrito no texto de abertura
  status      TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aceito','recusado')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.agora_aeon_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agora_aeon_applications_insert_own" ON public.agora_aeon_applications;
CREATE POLICY "agora_aeon_applications_insert_own" ON public.agora_aeon_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "agora_aeon_applications_select_own" ON public.agora_aeon_applications;
CREATE POLICY "agora_aeon_applications_select_own" ON public.agora_aeon_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Admins (painel admin.html) veem e decidem todos os pedidos.
DROP POLICY IF EXISTS "agora_aeon_applications_select_admin" ON public.agora_aeon_applications;
CREATE POLICY "agora_aeon_applications_select_admin" ON public.agora_aeon_applications
  FOR SELECT USING (is_admin_user());
DROP POLICY IF EXISTS "agora_aeon_applications_admin_write" ON public.agora_aeon_applications;
CREATE POLICY "agora_aeon_applications_admin_write" ON public.agora_aeon_applications
  FOR UPDATE USING (is_admin_user()) WITH CHECK (is_admin_user());

-- ── Fim da migração v9 ─────────────────────────────────────────────────
