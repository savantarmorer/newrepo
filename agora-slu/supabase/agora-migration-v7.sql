-- =====================================================================
-- ÁGORA (SLU) — Migração v7
-- 1) Ledger unificado de XP (agora_xp_ledger) — vira ao mesmo tempo:
--    a) trava de idempotência para novas fontes de XP por gatilho, e
--    b) a fonte de dados do feed de atividade coletiva.
-- 2) Novas fontes de XP reais: RSVP em Evento, RSVP em Chamada, nota no
--    Códice, nota em Investigações — hoje essas ações não davam XP nenhum.
-- 3) Ficha Pró-Vida passa a criar/vincular automaticamente um item em
--    Investigações com o mesmo código, em vez de serem listas paralelas.
-- 4) Limpa missões órfãs/duplicadas (Clube do Livro foi removido do site;
--    "Registrar Análise de Investigação" agora paga via gatilho direto).
--
-- Execute DEPOIS de agora-migration.sql + v2 + v3 + v4 + v5 + v6.
-- =====================================================================

-- =====================================================================
-- 1. LEDGER DE XP
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.agora_xp_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nome  TEXT,
  xp          INTEGER NOT NULL,
  motivo      TEXT NOT NULL,
  fonte_tipo  TEXT NOT NULL,   -- evento_rsvp | chamada_rsvp | codex_nota | investigacao_nota | missao | tarefa | ficha_provida
  fonte_id    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Impede conceder XP duas vezes pela mesma origem (ex: cancelar e
-- reconfirmar presença no mesmo evento não paga de novo).
CREATE UNIQUE INDEX IF NOT EXISTS agora_xp_ledger_fonte_unica
  ON public.agora_xp_ledger (user_id, fonte_tipo, fonte_id) WHERE fonte_id IS NOT NULL;

ALTER TABLE public.agora_xp_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agora_xp_ledger_select_all" ON public.agora_xp_ledger;
CREATE POLICY "agora_xp_ledger_select_all" ON public.agora_xp_ledger
  FOR SELECT USING (auth.role() = 'authenticated');
-- Sem policy de INSERT: só via gatilhos/RPCs SECURITY DEFINER abaixo.

-- Helper reutilizado pelos gatilhos novos.
CREATE OR REPLACE FUNCTION public.conceder_xp(
  p_user_id UUID, p_xp INTEGER, p_motivo TEXT, p_fonte_tipo TEXT, p_fonte_id TEXT, p_autor_nome TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  nome TEXT;
  novo_xp INTEGER;
BEGIN
  nome := COALESCE(NULLIF(p_autor_nome, ''), (
    SELECT COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
    FROM auth.users WHERE id = p_user_id
  ));

  BEGIN
    INSERT INTO agora_xp_ledger (user_id, autor_nome, xp, motivo, fonte_tipo, fonte_id)
    VALUES (p_user_id, nome, p_xp, p_motivo, p_fonte_tipo, p_fonte_id);
  EXCEPTION WHEN unique_violation THEN
    RETURN false; -- já concedido antes por essa origem
  END;

  IF p_xp <> 0 THEN
    UPDATE agora_profiles SET xp = xp + p_xp WHERE id = p_user_id RETURNING xp INTO novo_xp;
    UPDATE agora_profiles SET grau = calcular_grau_agora(novo_xp) WHERE id = p_user_id;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.obter_atividade_recente(p_limite INTEGER DEFAULT 20)
RETURNS TABLE (autor_nome TEXT, xp INTEGER, motivo TEXT, fonte_tipo TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT autor_nome, xp, motivo, fonte_tipo, created_at
  FROM agora_xp_ledger
  ORDER BY created_at DESC
  LIMIT LEAST(GREATEST(p_limite, 1), 100);
$$;

-- =====================================================================
-- 2. NOVAS FONTES DE XP — RSVP em Evento
-- =====================================================================
CREATE OR REPLACE FUNCTION public.trg_xp_evento_rsvp() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ev RECORD;
BEGIN
  SELECT titulo INTO ev FROM agora_events WHERE id = NEW.event_id;
  PERFORM conceder_xp(NEW.user_id, 30, 'Confirmou presença em "' || COALESCE(ev.titulo, 'um evento') || '"', 'evento_rsvp', NEW.event_id::text);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_event_rsvp_xp ON public.agora_event_rsvps;
CREATE TRIGGER on_event_rsvp_xp AFTER INSERT ON public.agora_event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.trg_xp_evento_rsvp();

-- RSVP em Chamada do Calendário
CREATE OR REPLACE FUNCTION public.trg_xp_chamada_rsvp() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c RECORD;
BEGIN
  SELECT titulo INTO c FROM agora_calls WHERE id = NEW.call_id;
  PERFORM conceder_xp(NEW.user_id, 30, 'Confirmou presença em "' || COALESCE(c.titulo, 'uma chamada') || '"', 'chamada_rsvp', NEW.call_id::text);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_call_rsvp_xp ON public.agora_call_rsvps;
CREATE TRIGGER on_call_rsvp_xp AFTER INSERT ON public.agora_call_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.trg_xp_chamada_rsvp();

-- Nota de margem no Códice
CREATE OR REPLACE FUNCTION public.trg_xp_codex_nota() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM conceder_xp(NEW.user_id, 20, 'Escreveu uma nota de margem no Códice', 'codex_nota', NEW.id::text, NEW.autor_nome);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_codex_nota_xp ON public.agora_codex_notes;
CREATE TRIGGER on_codex_nota_xp AFTER INSERT ON public.agora_codex_notes
  FOR EACH ROW EXECUTE FUNCTION public.trg_xp_codex_nota();

-- Nota de investigação
CREATE OR REPLACE FUNCTION public.trg_xp_investigacao_nota() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM conceder_xp(NEW.user_id, 25, 'Registrou uma análise em Investigações', 'investigacao_nota', NEW.id::text, NEW.autor_nome);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_investigacao_nota_xp ON public.agora_investigacao_notas;
CREATE TRIGGER on_investigacao_nota_xp AFTER INSERT ON public.agora_investigacao_notas
  FOR EACH ROW EXECUTE FUNCTION public.trg_xp_investigacao_nota();

-- =====================================================================
-- 3. REGISTRA NO LEDGER AS FONTES DE XP JÁ EXISTENTES (missões, tarefas,
--    fichas Pró-Vida) — mesma lógica de sempre, só passa a também
--    alimentar o feed de atividade coletiva.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.concluir_missao(uid UUID, p_mission_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m RECORD;
  ja BOOLEAN;
  novo_xp INTEGER;
BEGIN
  SELECT * INTO m FROM agora_missions WHERE id = p_mission_id AND ativo;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'mensagem', 'Missão inexistente.'); END IF;

  SELECT EXISTS(SELECT 1 FROM agora_mission_completions WHERE mission_id = p_mission_id AND user_id = uid) INTO ja;
  IF ja THEN RETURN json_build_object('ok', true, 'ja_concluida', true, 'xp_ganho', 0); END IF;

  INSERT INTO agora_mission_completions (mission_id, user_id) VALUES (p_mission_id, uid);
  UPDATE agora_profiles SET xp = xp + m.xp_reward WHERE id = uid RETURNING xp INTO novo_xp;
  UPDATE agora_profiles SET grau = calcular_grau_agora(novo_xp) WHERE id = uid;
  IF m.xp_reward > 0 THEN
    INSERT INTO agora_xp_ledger (user_id, xp, motivo, fonte_tipo, fonte_id)
    VALUES (uid, m.xp_reward, 'Concluiu a missão "' || m.titulo || '"', 'missao', p_mission_id::text)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN json_build_object('ok', true, 'ja_concluida', false, 'xp_ganho', m.xp_reward, 'novo_xp', novo_xp);
END;
$$;

CREATE OR REPLACE FUNCTION public.concluir_tarefa(uid UUID, p_task_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t RECORD;
  novo_xp INTEGER;
BEGIN
  SELECT * INTO t FROM agora_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'mensagem', 'Tarefa inexistente.'); END IF;
  IF t.claimed_by IS DISTINCT FROM uid THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Você não é o responsável por esta tarefa.');
  END IF;
  IF t.status <> 'em_andamento' THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Esta tarefa não está em andamento.');
  END IF;

  UPDATE agora_tasks SET status = 'concluida', concluded_at = now() WHERE id = p_task_id;
  UPDATE agora_profiles SET xp = xp + t.xp_reward WHERE id = uid RETURNING xp INTO novo_xp;
  UPDATE agora_profiles SET grau = calcular_grau_agora(novo_xp) WHERE id = uid;
  IF t.xp_reward > 0 THEN
    INSERT INTO agora_xp_ledger (user_id, xp, motivo, fonte_tipo, fonte_id)
    VALUES (uid, t.xp_reward, 'Concluiu a tarefa "' || t.titulo || '"', 'tarefa', p_task_id::text)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN json_build_object('ok', true, 'mensagem', 'Tarefa concluída. XP creditado.', 'xp_ganho', t.xp_reward, 'novo_xp', novo_xp);
END;
$$;

-- =====================================================================
-- 4. FICHA PRÓ-VIDA — passa a também alimentar o ledger e a criar/
--    vincular automaticamente o item correspondente em Investigações.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.enviar_ficha_provida(uid UUID, p_ficha JSONB)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  doc_id TEXT := NULLIF(trim(p_ficha->>'documento_id'), '');
  ja BOOLEAN;
  xp_concedido INTEGER := 250;
  novo_xp INTEGER;
  nova public.agora_provida_fichas;
  investigacao_existe BOOLEAN;
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

  IF xp_concedido > 0 THEN
    INSERT INTO agora_xp_ledger (user_id, autor_nome, xp, motivo, fonte_tipo, fonte_id)
    VALUES (uid, p_ficha->>'analista_tag', xp_concedido, 'Enviou a Ficha Pró-Vida "' || doc_id || '"', 'ficha_provida', nova.id::text)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Une Pró-Vida e Investigações: se ainda não existe um item de
  -- investigação com este código, cria um automaticamente.
  SELECT EXISTS(SELECT 1 FROM agora_investigacoes WHERE codigo = doc_id) INTO investigacao_existe;
  IF NOT investigacao_existe THEN
    INSERT INTO agora_investigacoes (codigo, titulo, descricao, status, categoria, criado_por)
    VALUES (
      doc_id, COALESCE(NULLIF(p_ficha->>'titulo', ''), doc_id), p_ficha->>'resumo',
      'em_analise', 'pró-vida', uid
    );
  END IF;

  RETURN json_build_object(
    'ok', true, 'mensagem', 'Ficha registrada na investigação coletiva.',
    'xp_ganho', xp_concedido, 'novo_xp', novo_xp, 'ficha_id', nova.id
  );
END;
$$;

-- =====================================================================
-- 5. BACKFILL — concede retroativamente o XP das novas fontes pra quem
--    já tinha RSVP/notas registradas antes desta migração existir.
-- =====================================================================
WITH novos AS (
  INSERT INTO agora_xp_ledger (user_id, xp, motivo, fonte_tipo, fonte_id)
  SELECT r.user_id, 30, 'Confirmou presença em "' || COALESCE(e.titulo, 'um evento') || '"', 'evento_rsvp', r.event_id::text
  FROM agora_event_rsvps r JOIN agora_events e ON e.id = r.event_id
  ON CONFLICT DO NOTHING
  RETURNING user_id, xp
)
UPDATE agora_profiles p SET xp = p.xp + s.total
FROM (SELECT user_id, SUM(xp) AS total FROM novos GROUP BY user_id) s
WHERE p.id = s.user_id;

WITH novos AS (
  INSERT INTO agora_xp_ledger (user_id, xp, motivo, fonte_tipo, fonte_id)
  SELECT r.user_id, 30, 'Confirmou presença em "' || COALESCE(c.titulo, 'uma chamada') || '"', 'chamada_rsvp', r.call_id::text
  FROM agora_call_rsvps r JOIN agora_calls c ON c.id = r.call_id
  ON CONFLICT DO NOTHING
  RETURNING user_id, xp
)
UPDATE agora_profiles p SET xp = p.xp + s.total
FROM (SELECT user_id, SUM(xp) AS total FROM novos GROUP BY user_id) s
WHERE p.id = s.user_id;

WITH novos AS (
  INSERT INTO agora_xp_ledger (user_id, xp, motivo, fonte_tipo, fonte_id, autor_nome)
  SELECT n.user_id, 20, 'Escreveu uma nota de margem no Códice', 'codex_nota', n.id::text, n.autor_nome
  FROM agora_codex_notes n
  ON CONFLICT DO NOTHING
  RETURNING user_id, xp
)
UPDATE agora_profiles p SET xp = p.xp + s.total
FROM (SELECT user_id, SUM(xp) AS total FROM novos GROUP BY user_id) s
WHERE p.id = s.user_id;

WITH novos AS (
  INSERT INTO agora_xp_ledger (user_id, xp, motivo, fonte_tipo, fonte_id, autor_nome)
  SELECT n.user_id, 25, 'Registrou uma análise em Investigações', 'investigacao_nota', n.id::text, n.autor_nome
  FROM agora_investigacao_notas n
  ON CONFLICT DO NOTHING
  RETURNING user_id, xp
)
UPDATE agora_profiles p SET xp = p.xp + s.total
FROM (SELECT user_id, SUM(xp) AS total FROM novos GROUP BY user_id) s
WHERE p.id = s.user_id;

-- Recalcula o grau de todo mundo com base no XP atualizado.
UPDATE agora_profiles SET grau = calcular_grau_agora(xp);

-- =====================================================================
-- 6. LIMPEZA DE MISSÕES — Clube do Livro foi removido do site (missão
--    órfã); Investigações agora paga XP direto pela nota (evita pagar
--    duas vezes pela mesma ação, mesmo padrão já usado na Ficha Pró-Vida).
-- =====================================================================
DELETE FROM public.agora_missions WHERE titulo = 'Confirmar presença em uma Sessão do Clube do Livro';
UPDATE public.agora_missions SET xp_reward = 0 WHERE titulo = 'Registrar uma Análise de Investigação';

-- ── Fim da migração v7 ─────────────────────────────────────────────────
