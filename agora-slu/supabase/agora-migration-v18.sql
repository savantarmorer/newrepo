-- =====================================================================
-- ÁGORA (SLU) — Migração v18
-- Quatro funcionalidades de interação entre usuários:
--
-- 1) REAÇÕES E RESPOSTAS em notas de Investigações — emoji toggle
--    (direto pelo cliente, baixo risco) + resposta encadeada a uma
--    nota específica (uma camada, não infinito).
--
-- 2) DIRETÓRIO DE MEMBROS — nenhuma tabela nova, só usa agora_profiles
--    (já pública desde a v17).
--
-- 3) "ONLINE AGORA" — ultimo_ping em agora_profiles, atualizado a
--    cada carregamento de página autenticada; considerado "online"
--    quem pingou nos últimos 5 minutos.
--
-- 4) MENSAGENS DIRETAS — tabela nova, RLS fechada (zero policy de
--    acesso direto — tudo passa por RPC SECURITY DEFINER, que também
--    confere uid = auth.uid() manualmente pra não deixar ninguém ler
--    a conversa de outra pessoa forjando o parâmetro). Envio de
--    mensagem gera uma notificação normal (reaproveita agora_notificacoes).
--
-- Execute DEPOIS de agora-migration.sql + v2 até v17.
-- =====================================================================

-- ── 1) Reações e respostas em notas de investigação ─────────────────────
ALTER TABLE public.agora_investigacao_notas ADD COLUMN IF NOT EXISTS resposta_a UUID REFERENCES public.agora_investigacao_notas(id);

CREATE TABLE IF NOT EXISTS public.agora_investigacao_nota_reacoes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id    UUID NOT NULL REFERENCES public.agora_investigacao_notas(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (nota_id, user_id, emoji)
);
ALTER TABLE public.agora_investigacao_nota_reacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agora_nota_reacoes_select_all" ON public.agora_investigacao_nota_reacoes;
CREATE POLICY "agora_nota_reacoes_select_all" ON public.agora_investigacao_nota_reacoes
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "agora_nota_reacoes_insert_own" ON public.agora_investigacao_nota_reacoes;
CREATE POLICY "agora_nota_reacoes_insert_own" ON public.agora_investigacao_nota_reacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "agora_nota_reacoes_delete_own" ON public.agora_investigacao_nota_reacoes;
CREATE POLICY "agora_nota_reacoes_delete_own" ON public.agora_investigacao_nota_reacoes
  FOR DELETE USING (auth.uid() = user_id);

-- ── 3) Presença "online agora" ───────────────────────────────────────────
ALTER TABLE public.agora_profiles ADD COLUMN IF NOT EXISTS ultimo_ping TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.registrar_presenca(uid UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN RETURN; END IF;
  UPDATE agora_profiles SET ultimo_ping = now() WHERE id = uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.obter_online_agora()
RETURNS TABLE (id UUID, nome_exibicao TEXT, avatar_url TEXT, grau INTEGER)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, nome_exibicao, avatar_url, grau FROM agora_profiles
  WHERE ultimo_ping IS NOT NULL AND ultimo_ping > now() - interval '5 minutes'
  ORDER BY ultimo_ping DESC;
$$;

-- ── 4) Mensagens diretas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agora_mensagens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  texto           TEXT NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 2000),
  lida            BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agora_mensagens ENABLE ROW LEVEL SECURITY;
-- De propósito, SEM policy nenhuma aqui — todo acesso passa pelas RPCs
-- abaixo (SECURITY DEFINER), que conferem uid = auth.uid() na mão.
-- Fechado por padrão é o comportamento certo pra conversa privada.

CREATE OR REPLACE FUNCTION public.enviar_mensagem(remetente UUID, p_destinatario_id UUID, p_texto TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  texto_limpo TEXT := NULLIF(trim(p_texto), '');
  nova public.agora_mensagens;
  nome_remetente TEXT;
BEGIN
  IF remetente IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Não autorizado.');
  END IF;
  IF texto_limpo IS NULL THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Escreva algo antes de enviar.');
  END IF;
  IF p_destinatario_id = remetente THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Você não pode enviar mensagem pra si mesmo.');
  END IF;
  IF NOT EXISTS(SELECT 1 FROM agora_profiles WHERE id = p_destinatario_id) THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Destinatário não encontrado.');
  END IF;

  INSERT INTO agora_mensagens (remetente_id, destinatario_id, texto)
  VALUES (remetente, p_destinatario_id, texto_limpo) RETURNING * INTO nova;

  SELECT COALESCE(nome_exibicao, 'Um Iniciado') INTO nome_remetente FROM agora_profiles WHERE id = remetente;
  INSERT INTO agora_notificacoes (user_id, tipo, mensagem, link)
  VALUES (p_destinatario_id, 'mensagem', nome_remetente || ' te enviou uma mensagem.', 'mensagens.html?com=' || remetente::text);

  RETURN json_build_object('ok', true, 'mensagem_id', nova.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.obter_conversas(uid UUID)
RETURNS TABLE (outro_id UUID, nome_exibicao TEXT, avatar_url TEXT, ultima_mensagem TEXT, ultima_em TIMESTAMPTZ, nao_lidas BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH minhas AS (
    SELECT CASE WHEN remetente_id = uid THEN destinatario_id ELSE remetente_id END AS outro_id,
           texto, created_at, lida, destinatario_id
    FROM agora_mensagens
    WHERE uid = auth.uid() AND (remetente_id = uid OR destinatario_id = uid)
  ),
  ultimas AS (
    SELECT DISTINCT ON (outro_id) outro_id, texto, created_at
    FROM minhas ORDER BY outro_id, created_at DESC
  ),
  naolidas AS (
    SELECT outro_id, COUNT(*) AS n FROM minhas WHERE destinatario_id = uid AND NOT lida GROUP BY outro_id
  )
  SELECT u.outro_id, p.nome_exibicao, p.avatar_url, u.texto, u.created_at, COALESCE(nl.n, 0)
  FROM ultimas u
  JOIN agora_profiles p ON p.id = u.outro_id
  LEFT JOIN naolidas nl ON nl.outro_id = u.outro_id
  ORDER BY u.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.obter_mensagens(uid UUID, outro_id UUID)
RETURNS TABLE (id UUID, remetente_id UUID, texto TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, remetente_id, texto, created_at FROM agora_mensagens
  WHERE uid = auth.uid()
    AND ((remetente_id = uid AND destinatario_id = outro_id) OR (remetente_id = outro_id AND destinatario_id = uid))
  ORDER BY created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.marcar_mensagens_lidas(uid UUID, outro_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN RETURN; END IF;
  UPDATE agora_mensagens SET lida = true WHERE destinatario_id = uid AND remetente_id = outro_id AND NOT lida;
END;
$$;

-- ── Fim da migração v18 ─────────────────────────────────────────────────
