-- =====================================================================
-- ÁGORA (SLU) — Migração v5
-- 1) Perfil administrador (is_admin) + RPCs de Governança para abrir/
--    encerrar decretos (antes só dava para fazer isso no Table Editor).
-- 2) Renomeia o antigo cofre de Evidências do ARG (agora_arg_evidence /
--    agora_evidence_notes) para Investigações (agora_investigacoes /
--    agora_investigacao_notas) — mesmos dados, sem o tema fictício do
--    Pen Drive, agora com inserção aberta a qualquer iniciado.
-- 3) Ficha de Análise Pró-Vida (agora_provida_fichas) com XP real.
-- 4) Remove o Terminal ARG do quadro de Missões (a página foi retirada
--    do site; nenhuma tabela do ARG é apagada, só deixa de ser usada).
--
-- Execute DEPOIS de agora-migration.sql + v2.sql + v3.sql + v4.sql.
-- =====================================================================

-- =====================================================================
-- 1. ADMINISTRADORES + GOVERNANÇA
-- =====================================================================
ALTER TABLE public.agora_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Para tornar alguém administrador: rode no SQL Editor do Supabase
--   UPDATE public.agora_profiles SET is_admin = true WHERE id = '<uuid do usuário>';

CREATE OR REPLACE FUNCTION public.criar_decreto(
  uid UUID, p_titulo TEXT, p_descricao TEXT, p_quorum_min INTEGER, p_horas_duracao NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sou_admin BOOLEAN;
  novo_numero INTEGER;
  novo public.agora_decrees;
BEGIN
  SELECT is_admin INTO sou_admin FROM agora_profiles WHERE id = uid;
  IF NOT COALESCE(sou_admin, false) THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Apenas administradores podem abrir novos decretos.');
  END IF;
  IF p_titulo IS NULL OR length(trim(p_titulo)) = 0 THEN
    RETURN json_build_object('ok', false, 'mensagem', 'O decreto precisa de um título.');
  END IF;

  SELECT COALESCE(MAX(numero), 0) + 1 INTO novo_numero FROM agora_decrees;

  INSERT INTO agora_decrees (numero, titulo, descricao, proponente, quorum_min, fecha_em)
  SELECT
    novo_numero, p_titulo, p_descricao,
    COALESCE((SELECT discord_username FROM agora_discord_sync WHERE user_id = uid), 'Conselho'),
    COALESCE(p_quorum_min, 60),
    now() + (COALESCE(p_horas_duracao, 72)::text || ' hours')::interval
  RETURNING * INTO novo;

  RETURN json_build_object('ok', true, 'mensagem', 'Decreto aberto ao Círculo.', 'decreto', row_to_json(novo));
END;
$$;

CREATE OR REPLACE FUNCTION public.definir_status_decreto(uid UUID, p_decree_id UUID, p_status TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sou_admin BOOLEAN;
BEGIN
  SELECT is_admin INTO sou_admin FROM agora_profiles WHERE id = uid;
  IF NOT COALESCE(sou_admin, false) THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Apenas administradores podem encerrar decretos.');
  END IF;
  IF p_status NOT IN ('aberto','aprovado','rejeitado') THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Status inválido.');
  END IF;

  UPDATE agora_decrees
    SET status = p_status, fecha_em = LEAST(fecha_em, now())
    WHERE id = p_decree_id;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'mensagem', 'Decreto inexistente.'); END IF;

  RETURN json_build_object('ok', true, 'mensagem', 'Status do decreto atualizado.');
END;
$$;

-- =====================================================================
-- 2. INVESTIGAÇÕES — renomeia o antigo cofre de Evidências do ARG
-- =====================================================================
ALTER TABLE IF EXISTS public.agora_arg_evidence RENAME TO agora_investigacoes;
ALTER TABLE IF EXISTS public.agora_evidence_notes RENAME TO agora_investigacao_notas;
ALTER TABLE IF EXISTS public.agora_investigacao_notas RENAME COLUMN evidence_id TO investigacao_id;

-- Cobre também instalações novas onde v2.sql nunca rodou.
CREATE TABLE IF NOT EXISTS public.agora_investigacoes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo         TEXT NOT NULL,
  titulo         TEXT NOT NULL,
  descricao      TEXT,
  encontrado_em  TEXT,
  status         TEXT NOT NULL DEFAULT 'em_analise' CHECK (status IN ('decifrado','em_analise','confirmado')),
  selo_ref       TEXT DEFAULT 'seal-umbra-kael',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agora_investigacao_notas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigacao_id  UUID NOT NULL REFERENCES public.agora_investigacoes(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nome       TEXT,
  nota             TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agora_investigacoes      ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.agora_investigacoes      ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'geral';

ALTER TABLE public.agora_investigacoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_investigacao_notas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agora_arg_evidence_select_all" ON public.agora_investigacoes;
DROP POLICY IF EXISTS "agora_investigacoes_select_all" ON public.agora_investigacoes;
CREATE POLICY "agora_investigacoes_select_all" ON public.agora_investigacoes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Qualquer iniciado autenticado pode registrar um novo arquivo/documento
-- para a investigação coletiva (antes só dava para inserir via seed/SQL).
DROP POLICY IF EXISTS "agora_investigacoes_insert_own" ON public.agora_investigacoes;
CREATE POLICY "agora_investigacoes_insert_own" ON public.agora_investigacoes
  FOR INSERT WITH CHECK (auth.uid() = criado_por);

DROP POLICY IF EXISTS "agora_evidence_notes_select_all" ON public.agora_investigacao_notas;
DROP POLICY IF EXISTS "agora_investigacao_notas_select_all" ON public.agora_investigacao_notas;
CREATE POLICY "agora_investigacao_notas_select_all" ON public.agora_investigacao_notas
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "agora_evidence_notes_insert_own" ON public.agora_investigacao_notas;
DROP POLICY IF EXISTS "agora_investigacao_notas_insert_own" ON public.agora_investigacao_notas;
CREATE POLICY "agora_investigacao_notas_insert_own" ON public.agora_investigacao_notas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin ajusta o status de uma investigação (em_analise/decifrado/confirmado)
CREATE OR REPLACE FUNCTION public.atualizar_status_investigacao(uid UUID, p_investigacao_id UUID, p_status TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sou_admin BOOLEAN;
BEGIN
  SELECT is_admin INTO sou_admin FROM agora_profiles WHERE id = uid;
  IF NOT COALESCE(sou_admin, false) THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Apenas administradores podem alterar o status.');
  END IF;
  IF p_status NOT IN ('decifrado','em_analise','confirmado') THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Status inválido.');
  END IF;

  UPDATE agora_investigacoes SET status = p_status WHERE id = p_investigacao_id;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'mensagem', 'Item inexistente.'); END IF;

  RETURN json_build_object('ok', true, 'mensagem', 'Status atualizado.');
END;
$$;

-- =====================================================================
-- 3. FICHA DE ANÁLISE — MATERIAL PRÓ-VIDA
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.agora_provida_fichas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id        TEXT NOT NULL,                 -- ex: PV-B01
  analista_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analista_tag        TEXT,                           -- snapshot do nome de exibição (RLS não permite juntar com auth.users)
  tipo_peca           TEXT,                           -- aula | apostila | lista_afirmacoes | exercicio | carta | outro
  tipo_peca_outro     TEXT,
  curso_posicao       TEXT,
  titulo              TEXT,
  procedencia         TEXT,                           -- integro | parcial | ilegivel
  resumo              TEXT,
  funcao_funil        TEXT,                           -- captar | doutrinar | induzir | escalar | outra
  funcao_funil_outra  TEXT,
  publico_alvo        TEXT,
  estrutura_retorica  TEXT,
  tecnicas            JSONB NOT NULL DEFAULT '[]',    -- [{tecnica, aparece, trecho}]
  afirmacoes          JSONB NOT NULL DEFAULT '[]',    -- [{afirmacao, categoria, fonte_real, checar}]
  material_terceiros  JSONB NOT NULL DEFAULT '[]',    -- [{elemento, origem_real, trecho}]
  lexico              JSONB NOT NULL DEFAULT '[]',    -- [{termo, definicao_texto, origem_externa}]
  pessoas_entidades   TEXT,
  datas_locais        TEXT,
  trechos_chave       TEXT,
  conexoes            TEXT,
  relevancia          INTEGER CHECK (relevancia BETWEEN 1 AND 5),
  relevancia_motivo   TEXT,
  gancho_conteudo     JSONB NOT NULL DEFAULT '[]',    -- ["reel","video","capitulo","contexto"]
  pendencias          TEXT,
  confianca           TEXT,                           -- alta | media | baixa
  observacoes         TEXT,
  xp_ganho            INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (documento_id, analista_user_id)
);

ALTER TABLE public.agora_provida_fichas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_provida_fichas_select_all" ON public.agora_provida_fichas
  FOR SELECT USING (auth.role() = 'authenticated');
-- Sem policy de INSERT direta: só via enviar_ficha_provida() (SECURITY DEFINER),
-- que garante XP correto e uma ficha por analista/documento.

CREATE OR REPLACE FUNCTION public.enviar_ficha_provida(uid UUID, p_ficha JSONB)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  doc_id TEXT := NULLIF(trim(p_ficha->>'documento_id'), '');
  ja BOOLEAN;
  xp_concedido INTEGER := 250;
  novo_xp INTEGER;
  nova public.agora_provida_fichas;
BEGIN
  IF doc_id IS NULL THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Informe o ID do documento (ex: PV-B01).');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM agora_provida_fichas WHERE documento_id = doc_id AND analista_user_id = uid
  ) INTO ja;
  IF ja THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Você já enviou uma ficha para este documento.');
  END IF;

  INSERT INTO agora_provida_fichas (
    documento_id, analista_user_id, analista_tag, tipo_peca, tipo_peca_outro, curso_posicao, titulo, procedencia,
    resumo, funcao_funil, funcao_funil_outra, publico_alvo, estrutura_retorica,
    tecnicas, afirmacoes, material_terceiros, lexico,
    pessoas_entidades, datas_locais, trechos_chave, conexoes,
    relevancia, relevancia_motivo, gancho_conteudo, pendencias, confianca, observacoes, xp_ganho
  ) VALUES (
    doc_id, uid, p_ficha->>'analista_tag',
    p_ficha->>'tipo_peca', p_ficha->>'tipo_peca_outro', p_ficha->>'curso_posicao', p_ficha->>'titulo', p_ficha->>'procedencia',
    p_ficha->>'resumo', p_ficha->>'funcao_funil', p_ficha->>'funcao_funil_outra', p_ficha->>'publico_alvo', p_ficha->>'estrutura_retorica',
    COALESCE(p_ficha->'tecnicas', '[]'::jsonb), COALESCE(p_ficha->'afirmacoes', '[]'::jsonb),
    COALESCE(p_ficha->'material_terceiros', '[]'::jsonb), COALESCE(p_ficha->'lexico', '[]'::jsonb),
    p_ficha->>'pessoas_entidades', p_ficha->>'datas_locais', p_ficha->>'trechos_chave', p_ficha->>'conexoes',
    NULLIF(p_ficha->>'relevancia', '')::INTEGER, p_ficha->>'relevancia_motivo',
    COALESCE(p_ficha->'gancho_conteudo', '[]'::jsonb), p_ficha->>'pendencias', p_ficha->>'confianca', p_ficha->>'observacoes',
    xp_concedido
  ) RETURNING * INTO nova;

  UPDATE agora_profiles SET xp = xp + xp_concedido WHERE id = uid RETURNING xp INTO novo_xp;
  UPDATE agora_profiles SET grau = calcular_grau_agora(novo_xp) WHERE id = uid;

  RETURN json_build_object(
    'ok', true, 'mensagem', 'Ficha registrada na investigação coletiva.',
    'xp_ganho', xp_concedido, 'novo_xp', novo_xp, 'ficha_id', nova.id
  );
END;
$$;

-- =====================================================================
-- 4. QUADRO DE MISSÕES — remove a missão do Terminal ARG (página retirada)
-- =====================================================================
DELETE FROM public.agora_missions WHERE titulo = 'Decodificar o Bloco 01 do Pen Drive';

UPDATE public.agora_missions
  SET titulo = 'Registrar uma Análise de Investigação',
      descricao = 'Registre uma nota de investigação em qualquer item de Investigações.'
  WHERE titulo = 'Submeter Análise da Ficha Esotérica';

-- agora_missions não tem UNIQUE em título, então o guard de idempotência
-- aqui é um WHERE NOT EXISTS (ON CONFLICT DO NOTHING não teria o que inferir).
INSERT INTO public.agora_missions (titulo, descricao, xp_reward)
SELECT 'Enviar uma Ficha Pró-Vida', 'Preencha e envie a Ficha de Análise de um material Pró-Vida.', 0
WHERE NOT EXISTS (SELECT 1 FROM public.agora_missions WHERE titulo = 'Enviar uma Ficha Pró-Vida');

-- ── Fim da migração v5 ─────────────────────────────────────────────────
