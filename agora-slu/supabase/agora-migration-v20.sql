-- =====================================================================
-- ÁGORA (SLU) — Migração v20
-- Câmara do Æon: monografias, nível noemático, glossário em camadas,
-- avaliação por pares e o selo progressivo de experiência.
--
-- Duas trilhas de progresso, deliberadamente separadas:
--   1) NÍVEL NOEMÁTICO (agora_aeon_membros.nivel) — cresce com a
--      QUALIDADE do que você mesmo produz (nota do admin nas suas
--      monografias + exercícios praticados). Controla o que o
--      Glossário libera pra você.
--   2) SELO DE EXPERIÊNCIA (agora_aeon_membros.selo_estagio) — cresce
--      com o quanto você ajuda a elevar o trabalho dos OUTROS
--      (comentar/expandir monografias alheias). É a "marca" visual que
--      vai se completando, símbolo de generosidade coletiva, não de
--      mérito próprio.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v19.
-- =====================================================================

-- ── Progresso no Muro ────────────────────────────────────────────────
ALTER TABLE public.agora_aeon_membros ADD COLUMN IF NOT EXISTS nivel INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.agora_aeon_membros ADD COLUMN IF NOT EXISTS pontos_nivel INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.agora_aeon_membros ADD COLUMN IF NOT EXISTS pontos_selo INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.agora_aeon_membros ADD COLUMN IF NOT EXISTS selo_estagio INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.calcular_nivel_aeon(pontos INTEGER)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN pontos >= 300 THEN 6
    WHEN pontos >= 180 THEN 5
    WHEN pontos >= 100 THEN 4
    WHEN pontos >= 50  THEN 3
    WHEN pontos >= 20  THEN 2
    ELSE 1
  END;
$$;

CREATE OR REPLACE FUNCTION public.calcular_selo_aeon(pontos INTEGER)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN pontos >= 70 THEN 5
    WHEN pontos >= 45 THEN 4
    WHEN pontos >= 25 THEN 3
    WHEN pontos >= 10 THEN 2
    WHEN pontos >= 1  THEN 1
    ELSE 0
  END;
$$;

-- ── Glossário em camadas (nível necessário por vertente + revelação) ──
ALTER TABLE public.agora_aeon_glossario ADD COLUMN IF NOT EXISTS nivel_pratica INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.agora_aeon_glossario ADD COLUMN IF NOT EXISTS nivel_esoterica INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.agora_aeon_glossario ADD COLUMN IF NOT EXISTS nivel_revelacao INTEGER NOT NULL DEFAULT 0;

-- ── Monografias ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agora_aeon_monografias (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nome         TEXT,
  titulo             TEXT NOT NULL,
  conteudo           TEXT NOT NULL,
  midias             JSONB NOT NULL DEFAULT '[]',
  esquema            TEXT,
  status             TEXT NOT NULL DEFAULT 'em_avaliacao' CHECK (status IN ('em_avaliacao','avaliada')),
  nota_admin         INTEGER CHECK (nota_admin BETWEEN 0 AND 10),
  pontos_concedidos  INTEGER NOT NULL DEFAULT 0,
  comentario_admin   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agora_aeon_monografias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agora_aeon_monografias_select" ON public.agora_aeon_monografias;
CREATE POLICY "agora_aeon_monografias_select" ON public.agora_aeon_monografias
  FOR SELECT USING (is_aeon_iniciado() OR is_admin_user());
DROP POLICY IF EXISTS "agora_aeon_monografias_insert_own" ON public.agora_aeon_monografias;
CREATE POLICY "agora_aeon_monografias_insert_own" ON public.agora_aeon_monografias
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_aeon_iniciado());
DROP POLICY IF EXISTS "agora_aeon_monografias_update_own_pendente" ON public.agora_aeon_monografias;
CREATE POLICY "agora_aeon_monografias_update_own_pendente" ON public.agora_aeon_monografias
  FOR UPDATE USING (auth.uid() = user_id AND status = 'em_avaliacao')
  WITH CHECK (auth.uid() = user_id AND status = 'em_avaliacao');
-- Avaliação (nota/status/pontos) só via avaliar_monografia() abaixo — não
-- existe policy de UPDATE pra admin aqui de propósito (RPC bypassa RLS).

-- ── Avaliações por pares (comentar/expandir a monografia de outro) ────
CREATE TABLE IF NOT EXISTS public.agora_aeon_avaliacoes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monografia_id  UUID NOT NULL REFERENCES public.agora_aeon_monografias(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nome     TEXT,
  tipo           TEXT NOT NULL CHECK (tipo IN ('comentario','expansao')),
  texto          TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agora_aeon_avaliacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agora_aeon_avaliacoes_select" ON public.agora_aeon_avaliacoes;
CREATE POLICY "agora_aeon_avaliacoes_select" ON public.agora_aeon_avaliacoes
  FOR SELECT USING (is_aeon_iniciado() OR is_admin_user());
-- Sem policy de insert direta — só via avaliar_monografia_par() (confere
-- que não é autoavaliação e credita o selo de experiência).

-- ── Enviar monografia ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enviar_monografia_aeon(uid UUID, p_titulo TEXT, p_conteudo TEXT, p_midias JSONB, p_esquema TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  titulo TEXT := NULLIF(trim(p_titulo), '');
  conteudo TEXT := NULLIF(trim(p_conteudo), '');
  nome TEXT;
  nova public.agora_aeon_monografias;
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Não autorizado.');
  END IF;
  IF NOT is_aeon_iniciado() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Só Iniciados do Æon podem enviar monografias.');
  END IF;
  IF titulo IS NULL OR conteudo IS NULL THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Título e conteúdo são obrigatórios.');
  END IF;

  SELECT nome_exibicao INTO nome FROM agora_profiles WHERE id = uid;

  INSERT INTO agora_aeon_monografias (user_id, autor_nome, titulo, conteudo, midias, esquema)
  VALUES (uid, nome, titulo, conteudo, COALESCE(p_midias, '[]'::jsonb), p_esquema)
  RETURNING * INTO nova;

  RETURN json_build_object('ok', true, 'id', nova.id);
END;
$$;

-- ── Admin avalia uma monografia (só admin de verdade, não só Guardião) ─
CREATE OR REPLACE FUNCTION public.avaliar_monografia(admin_uid UUID, p_monografia_id UUID, p_nota INTEGER, p_comentario TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  mono RECORD;
  pontos INTEGER;
  novo_total INTEGER;
BEGIN
  IF admin_uid IS DISTINCT FROM auth.uid() OR NOT is_admin_user() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Só um administrador pode avaliar.');
  END IF;
  IF p_nota IS NULL OR p_nota < 0 OR p_nota > 10 THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Nota precisa ser de 0 a 10.');
  END IF;

  SELECT * INTO mono FROM agora_aeon_monografias WHERE id = p_monografia_id;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'mensagem', 'Monografia não encontrada.'); END IF;

  pontos := p_nota * 5;

  UPDATE agora_aeon_monografias
    SET status = 'avaliada', nota_admin = p_nota, pontos_concedidos = pontos, comentario_admin = p_comentario
    WHERE id = p_monografia_id;

  UPDATE agora_aeon_membros SET pontos_nivel = pontos_nivel + pontos WHERE user_id = mono.user_id
    RETURNING pontos_nivel INTO novo_total;
  UPDATE agora_aeon_membros SET nivel = calcular_nivel_aeon(novo_total) WHERE user_id = mono.user_id;

  INSERT INTO agora_notificacoes (user_id, tipo, mensagem, link)
  VALUES (mono.user_id, 'aeon', 'Sua monografia "' || mono.titulo || '" foi avaliada (nota ' || p_nota || '/10).', 'aeon-monografia.html?id=' || mono.id::text);

  RETURN json_build_object('ok', true, 'novo_nivel', calcular_nivel_aeon(novo_total));
END;
$$;

-- ── Avaliação por pares (comentar/expandir) ─────────────────────────────
CREATE OR REPLACE FUNCTION public.avaliar_monografia_par(uid UUID, p_monografia_id UUID, p_tipo TEXT, p_texto TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  texto TEXT := NULLIF(trim(p_texto), '');
  mono RECORD;
  nome TEXT;
  ganho INTEGER;
  novo_total INTEGER;
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Não autorizado.');
  END IF;
  IF NOT is_aeon_iniciado() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Só Iniciados do Æon podem avaliar monografias.');
  END IF;
  IF p_tipo NOT IN ('comentario','expansao') THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Tipo inválido.');
  END IF;
  IF texto IS NULL THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Escreva algo antes de enviar.');
  END IF;

  SELECT * INTO mono FROM agora_aeon_monografias WHERE id = p_monografia_id;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'mensagem', 'Monografia não encontrada.'); END IF;
  IF mono.user_id = uid THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Você não pode avaliar sua própria monografia.');
  END IF;

  SELECT nome_exibicao INTO nome FROM agora_profiles WHERE id = uid;

  INSERT INTO agora_aeon_avaliacoes (monografia_id, user_id, autor_nome, tipo, texto)
  VALUES (p_monografia_id, uid, nome, p_tipo, texto);

  ganho := CASE p_tipo WHEN 'expansao' THEN 5 ELSE 2 END;
  UPDATE agora_aeon_membros SET pontos_selo = pontos_selo + ganho WHERE user_id = uid
    RETURNING pontos_selo INTO novo_total;
  UPDATE agora_aeon_membros SET selo_estagio = calcular_selo_aeon(novo_total) WHERE user_id = uid;

  RETURN json_build_object('ok', true, 'novo_selo', calcular_selo_aeon(novo_total));
END;
$$;

-- ── Exercício praticado também soma pro nível (só na 1ª resposta) ──────
CREATE OR REPLACE FUNCTION public.responder_exercicio_aeon(uid UUID, p_exercicio_id UUID, p_resposta TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  texto TEXT := NULLIF(trim(p_resposta), '');
  ja BOOLEAN;
  novo_total INTEGER;
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Não autorizado.');
  END IF;
  IF NOT is_aeon_iniciado() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Só Iniciados do Æon podem responder.');
  END IF;
  IF texto IS NULL THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Escreva algo antes de enviar.');
  END IF;

  SELECT EXISTS(SELECT 1 FROM agora_aeon_respostas WHERE exercicio_id = p_exercicio_id AND user_id = uid) INTO ja;

  INSERT INTO agora_aeon_respostas (exercicio_id, user_id, resposta)
  VALUES (p_exercicio_id, uid, texto)
  ON CONFLICT (exercicio_id, user_id) DO UPDATE SET resposta = EXCLUDED.resposta, created_at = now();

  IF NOT ja THEN
    UPDATE agora_aeon_membros SET pontos_nivel = pontos_nivel + 5 WHERE user_id = uid RETURNING pontos_nivel INTO novo_total;
    UPDATE agora_aeon_membros SET nivel = calcular_nivel_aeon(novo_total) WHERE user_id = uid;
  END IF;

  RETURN json_build_object('ok', true);
END;
$$;

-- ── Fim da migração v20 ─────────────────────────────────────────────────
