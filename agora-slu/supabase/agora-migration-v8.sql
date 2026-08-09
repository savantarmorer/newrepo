-- =====================================================================
-- ÁGORA (SLU) — Migração v8
-- Notificações leves in-app (sino no menu). Duas fontes automáticas:
--   1) Broadcast: um novo decreto é aberto no Conselho.
--   2) Direcionada: sua Ficha Pró-Vida foi removida pela moderação.
-- Sem tabela de "lido/não lido" no servidor — o cliente guarda o
-- timestamp da última vez que abriu o sino (localStorage) e conta
-- quantas notificações são mais novas que isso.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v7.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.agora_notificacoes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = broadcast pra todo mundo
  tipo       TEXT NOT NULL,
  mensagem   TEXT NOT NULL,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agora_notificacoes_created_at_idx ON public.agora_notificacoes (created_at DESC);

ALTER TABLE public.agora_notificacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agora_notificacoes_select_own_or_broadcast" ON public.agora_notificacoes;
CREATE POLICY "agora_notificacoes_select_own_or_broadcast" ON public.agora_notificacoes
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
-- Sem policy de INSERT: só via gatilhos SECURITY DEFINER abaixo.

-- ── Broadcast: novo decreto aberto ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notificar_novo_decreto() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO agora_notificacoes (user_id, tipo, mensagem, link)
  VALUES (NULL, 'decreto_aberto', 'Novo decreto em pauta: "' || NEW.titulo || '"', 'governanca.html');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_decreto_criado_notificar ON public.agora_decrees;
CREATE TRIGGER on_decreto_criado_notificar AFTER INSERT ON public.agora_decrees
  FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_novo_decreto();

-- ── Direcionada: ficha Pró-Vida removida pela moderação ────────────────
CREATE OR REPLACE FUNCTION public.trg_notificar_ficha_removida() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO agora_notificacoes (user_id, tipo, mensagem, link)
  VALUES (OLD.analista_user_id, 'ficha_removida', 'Sua Ficha Pró-Vida "' || OLD.documento_id || '" foi removida pela moderação.', 'provida.html');
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS on_ficha_provida_removida_notificar ON public.agora_provida_fichas;
CREATE TRIGGER on_ficha_provida_removida_notificar AFTER DELETE ON public.agora_provida_fichas
  FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_ficha_removida();

-- ── Fim da migração v8 ─────────────────────────────────────────────────
