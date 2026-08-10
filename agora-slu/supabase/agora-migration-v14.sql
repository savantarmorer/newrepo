-- =====================================================================
-- ÁGORA (SLU) — Migração v14
-- Corrige regressão introduzida pela v12: a missão "Votar em um Decreto
-- do Conselho" (existente no banco, mas que eu não tinha visto em
-- nenhuma migração anterior — foi criada direto pelo admin.html) ficou
-- com criterio_tipo NULL depois da v12, e como concluir_missao() só
-- aceita criterio_tipo reconhecido, essa missão ficou impossível de
-- concluir por qualquer pessoa.
--
-- Fix: adiciona o caso 'voto_decreto' (checa se existe voto do usuário
-- em agora_decree_votes) e atribui esse critério à missão existente.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v13.
-- =====================================================================

UPDATE public.agora_missions SET criterio_tipo = 'voto_decreto'
  WHERE titulo = 'Votar em um Decreto do Conselho';

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
    WHEN 'voto_decreto'      THEN EXISTS(SELECT 1 FROM agora_decree_votes WHERE user_id = uid)
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

-- ── Fim da migração v14 ─────────────────────────────────────────────────
