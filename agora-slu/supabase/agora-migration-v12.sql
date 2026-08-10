-- =====================================================================
-- ÁGORA (SLU) — Migração v12
-- Corrige concluir_missao(): hoje qualquer Iniciado autenticado marca
-- QUALQUER missão como concluída com um clique, sem cumprir nada — o
-- botão "Marcar como Concluída" era pura autodeclaração, sem checagem
-- nenhuma do lado do servidor. Isso dava XP de graça.
--
-- Fix: agora_missions ganha uma coluna criterio_tipo. concluir_missao()
-- só concede a missão se existir prova real do que ela pede (uma nota
-- de investigação registrada, uma ficha Pró-Vida enviada, etc.). Missão
-- sem criterio_tipo reconhecido não pode ser concluída — precisa de um
-- critério verificável definido antes de existir.
--
-- Também desativa (sem apagar — preserva o histórico de quem já
-- completou) a missão "Confirmar presença em uma Sessão do Clube do
-- Livro": a página Clube do Livro foi removida do site nesta sessão,
-- então a missão ficou órfã (não dá mais pra cumprir o que ela pede).
--
-- Execute DEPOIS de agora-migration.sql + v2 até v11.
-- =====================================================================

ALTER TABLE public.agora_missions ADD COLUMN IF NOT EXISTS criterio_tipo TEXT;

UPDATE public.agora_missions SET criterio_tipo = 'investigacao_nota'
  WHERE titulo = 'Registrar uma Análise de Investigação';

UPDATE public.agora_missions SET criterio_tipo = 'ficha_provida'
  WHERE titulo = 'Enviar uma Ficha Pró-Vida';

UPDATE public.agora_missions SET ativo = false
  WHERE titulo = 'Confirmar presença em uma Sessão do Clube do Livro';

CREATE OR REPLACE FUNCTION public.concluir_missao(uid UUID, p_mission_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m RECORD;
  ja BOOLEAN;
  cumpriu BOOLEAN;
  novo_xp INTEGER;
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Não autorizado.');
  END IF;

  SELECT * INTO m FROM agora_missions WHERE id = p_mission_id AND ativo;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'mensagem', 'Missão inexistente.'); END IF;

  SELECT EXISTS(SELECT 1 FROM agora_mission_completions WHERE mission_id = p_mission_id AND user_id = uid) INTO ja;
  IF ja THEN RETURN json_build_object('ok', true, 'ja_concluida', true, 'xp_ganho', 0); END IF;

  cumpriu := CASE m.criterio_tipo
    WHEN 'investigacao_nota' THEN EXISTS(SELECT 1 FROM agora_investigacao_notas WHERE user_id = uid)
    WHEN 'ficha_provida'     THEN EXISTS(SELECT 1 FROM agora_provida_fichas WHERE analista_user_id = uid)
    ELSE FALSE
  END;

  IF NOT cumpriu THEN
    RETURN json_build_object('ok', false, 'mensagem',
      'Você ainda não cumpriu o que esta missão pede: ' || COALESCE(m.descricao, m.titulo));
  END IF;

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

-- ── Fim da migração v12 ─────────────────────────────────────────────────
