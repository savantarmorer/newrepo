-- =====================================================================
-- ÁGORA (SLU) — Migração v17
-- Quatro melhorias sobre o sistema de conquistas/perfil da v16:
--
-- 1) PERFIS PÚBLICOS: agora_profiles fica legível por qualquer
--    autenticado (antes só a própria linha). Ganha nome_exibicao e
--    avatar_url — cópias públicas do nome/avatar do provedor OAuth,
--    porque auth.users nunca é exposto ao cliente pra outros usuários.
--    Continuam protegidas: só "bio", "nome_exibicao" e "avatar_url"
--    editáveis direto pelo cliente (mesmo esquema de GRANT de coluna
--    da v16); xp/grau/streak/is_admin/titulo_ativo_id só via RPC.
--
-- 2) PROGRESSO DE CONQUISTAS: calcular_valor_criterio() vira uma
--    função própria (reaproveitada por verificar_conquistas E pela
--    nova obter_progresso_conquistas), pra mostrar "3 de 5" nos
--    badges ainda bloqueados em vez de só um cadeado.
--
-- 3) "MÓDULO ENCERRADO": liga fichas Pró-Vida ao módulo do analista
--    (agora_provida_fichas.modulo_id) e dá ao admin um campo
--    meta_fichas em agora_provida_modulos. Quem enviar a ficha que
--    cruza a meta desbloqueia a conquista — verificado dentro do
--    próprio enviar_ficha_provida(), não no loop genérico.
--
-- 4) obter_atividade_recente() passa a devolver user_id, pra dar pra
--    linkar o feed de atividade pro perfil de quem fez a ação.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v16.
-- =====================================================================

-- ── 1) Perfis públicos ───────────────────────────────────────────────────
ALTER TABLE public.agora_profiles ADD COLUMN IF NOT EXISTS nome_exibicao TEXT;
ALTER TABLE public.agora_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

DROP POLICY IF EXISTS "agora_profiles_select_all" ON public.agora_profiles;
CREATE POLICY "agora_profiles_select_all" ON public.agora_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

REVOKE UPDATE ON public.agora_profiles FROM authenticated;
GRANT UPDATE (bio, nome_exibicao, avatar_url) ON public.agora_profiles TO authenticated;

-- ── 2) Critério de conquista como função reaproveitável ─────────────────
CREATE OR REPLACE FUNCTION public.calcular_valor_criterio(uid UUID, p_criterio_tipo TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN CASE p_criterio_tipo
    WHEN 'ficha_provida_count'     THEN (SELECT COUNT(*)::int FROM agora_provida_fichas WHERE analista_user_id = uid)
    WHEN 'investigacao_nota_count' THEN (SELECT COUNT(*)::int FROM agora_investigacao_notas WHERE user_id = uid)
    WHEN 'voto_decreto_count'      THEN (SELECT COUNT(*)::int FROM agora_decree_votes WHERE user_id = uid)
    WHEN 'tarefa_concluida_count'  THEN (SELECT COUNT(*)::int FROM agora_tasks WHERE claimed_by = uid AND status = 'concluida')
    WHEN 'codex_nota_count'        THEN (SELECT COUNT(*)::int FROM agora_codex_notes WHERE user_id = uid)
    WHEN 'streak_atual'            THEN (SELECT COALESCE(streak_atual, 0) FROM agora_profiles WHERE id = uid)
    WHEN 'streak_recorde'          THEN (SELECT COALESCE(streak_recorde, 0) FROM agora_profiles WHERE id = uid)
    WHEN 'aeon_pedido'             THEN (SELECT COUNT(*)::int FROM agora_aeon_applications WHERE user_id = uid)
    WHEN 'modulo_atribuido'        THEN (SELECT COUNT(*)::int FROM agora_provida_atribuicoes WHERE user_id = uid)
    WHEN 'grau_atual'              THEN (SELECT COALESCE(grau, 0) FROM agora_profiles WHERE id = uid)
    ELSE 0
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.verificar_conquistas(uid UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c RECORD;
  ja BOOLEAN;
  valor_atual INTEGER;
  novas JSONB := '[]'::jsonb;
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('ok', false, 'novas', '[]'::json);
  END IF;

  FOR c IN SELECT * FROM agora_conquistas WHERE ativo LOOP
    SELECT EXISTS(SELECT 1 FROM agora_conquistas_desbloqueadas WHERE user_id = uid AND conquista_id = c.id) INTO ja;
    IF ja THEN CONTINUE; END IF;

    valor_atual := calcular_valor_criterio(uid, c.criterio_tipo);

    IF valor_atual >= c.criterio_valor THEN
      INSERT INTO agora_conquistas_desbloqueadas (user_id, conquista_id) VALUES (uid, c.id);

      IF c.xp_bonus > 0 THEN
        UPDATE agora_profiles SET xp = xp + c.xp_bonus WHERE id = uid;
        UPDATE agora_profiles SET grau = calcular_grau_agora(xp) WHERE id = uid;
      END IF;

      INSERT INTO agora_xp_ledger (user_id, xp, motivo, fonte_tipo, fonte_id)
      VALUES (uid, c.xp_bonus, 'Desbloqueou a conquista "' || c.nome || '"', 'conquista', c.id::text)
      ON CONFLICT DO NOTHING;

      novas := novas || jsonb_build_object(
        'id', c.id, 'chave', c.chave, 'nome', c.nome, 'descricao', c.descricao,
        'icone', c.icone, 'raridade', c.raridade
      );
    END IF;
  END LOOP;

  RETURN json_build_object('ok', true, 'novas', novas);
END;
$$;

-- Progresso (read-only) de TODAS as conquistas ativas pra um usuário —
-- não muta nada, só usado pra mostrar "3 de 5" nos badges bloqueados.
-- Os critérios são todos calculados sobre tabelas já públicas (ou, no
-- caso de aeon_pedido, um limiar de 1 que não revela mais do que o
-- próprio desbloqueio já revela publicamente) — ver nota na conversa.
CREATE OR REPLACE FUNCTION public.obter_progresso_conquistas(uid UUID)
RETURNS TABLE (conquista_id UUID, valor_atual INTEGER)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, calcular_valor_criterio(uid, criterio_tipo) FROM agora_conquistas WHERE ativo;
$$;

-- ── 3) "Módulo Encerrado" ────────────────────────────────────────────────
ALTER TABLE public.agora_provida_modulos ADD COLUMN IF NOT EXISTS meta_fichas INTEGER;
ALTER TABLE public.agora_provida_fichas ADD COLUMN IF NOT EXISTS modulo_id UUID REFERENCES public.agora_provida_modulos(id);

INSERT INTO public.agora_conquistas (chave, nome, descricao, icone, raridade, criterio_tipo, criterio_valor) VALUES
  ('modulo_encerrado', 'Módulo Encerrado', 'Enviou a ficha que completou a meta de análise de um módulo inteiro.', '🏁', 'epica', 'evento_manual', 1)
ON CONFLICT (chave) DO NOTHING;

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
  meu_modulo_id UUID;
  meta INTEGER;
  total_modulo INTEGER;
  conquista_modulo_id UUID;
  conquista_modulo_nome TEXT;
  conquista_modulo_desc TEXT;
  conquista_modulo_icone TEXT;
  conquista_modulo_raridade TEXT;
  desbloqueio_id UUID;
  conquista_modulo JSONB := NULL;
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

  SELECT modulo_id INTO meu_modulo_id FROM agora_provida_atribuicoes WHERE user_id = uid;

  INSERT INTO agora_provida_fichas (
    documento_id, analista_user_id, analista_tag, modulo_id, tipo_peca, tipo_peca_outro, curso_posicao, titulo, procedencia,
    resumo, funcao_funil, funcao_funil_outra, publico_alvo, estrutura_retorica,
    tecnicas, afirmacoes, material_terceiros, lexico,
    pessoas_entidades, datas_locais, trechos_chave, conexoes,
    relevancia, relevancia_motivo, gancho_conteudo, pendencias, confianca, observacoes, xp_ganho
  ) VALUES (
    doc_id, uid, p_ficha->>'analista_tag', meu_modulo_id,
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

  SELECT EXISTS(SELECT 1 FROM agora_investigacoes WHERE codigo = doc_id) INTO investigacao_existe;
  IF NOT investigacao_existe THEN
    INSERT INTO agora_investigacoes (codigo, titulo, descricao, status, categoria, criado_por)
    VALUES (
      doc_id, COALESCE(NULLIF(p_ficha->>'titulo', ''), doc_id), p_ficha->>'resumo',
      'em_analise', 'pró-vida', uid
    );
  END IF;

  -- "Módulo Encerrado": se essa ficha fez o total do módulo cruzar a
  -- meta que o admin definiu, quem a enviou desbloqueia a conquista.
  IF meu_modulo_id IS NOT NULL THEN
    SELECT meta_fichas INTO meta FROM agora_provida_modulos WHERE id = meu_modulo_id;
    IF meta IS NOT NULL THEN
      SELECT COUNT(*)::int INTO total_modulo FROM agora_provida_fichas WHERE modulo_id = meu_modulo_id;
      IF total_modulo >= meta THEN
        SELECT id, nome, descricao, icone, raridade
          INTO conquista_modulo_id, conquista_modulo_nome, conquista_modulo_desc, conquista_modulo_icone, conquista_modulo_raridade
          FROM agora_conquistas WHERE chave = 'modulo_encerrado';

        IF conquista_modulo_id IS NOT NULL THEN
          INSERT INTO agora_conquistas_desbloqueadas (user_id, conquista_id)
          VALUES (uid, conquista_modulo_id)
          ON CONFLICT DO NOTHING
          RETURNING id INTO desbloqueio_id;

          IF desbloqueio_id IS NOT NULL THEN
            INSERT INTO agora_xp_ledger (user_id, xp, motivo, fonte_tipo, fonte_id)
            VALUES (uid, 0, 'Desbloqueou a conquista "Módulo Encerrado"', 'conquista', conquista_modulo_id::text)
            ON CONFLICT DO NOTHING;
            conquista_modulo := jsonb_build_object(
              'id', conquista_modulo_id, 'nome', conquista_modulo_nome, 'descricao', conquista_modulo_desc,
              'icone', conquista_modulo_icone, 'raridade', conquista_modulo_raridade
            );
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN json_build_object(
    'ok', true, 'mensagem', 'Ficha registrada na investigação coletiva.',
    'xp_ganho', xp_concedido, 'novo_xp', novo_xp, 'ficha_id', nova.id,
    'conquista_modulo', conquista_modulo
  );
END;
$$;

-- ── 4) Feed de atividade linkável a perfis ──────────────────────────────
-- CREATE OR REPLACE não pode mudar o formato de retorno de uma função
-- (estamos acrescentando user_id às colunas) — precisa dropar antes.
DROP FUNCTION IF EXISTS public.obter_atividade_recente(INTEGER, TIMESTAMPTZ, TEXT);

CREATE OR REPLACE FUNCTION public.obter_atividade_recente(
  p_limite INTEGER DEFAULT 20, p_antes_de TIMESTAMPTZ DEFAULT NULL, p_fonte_tipo TEXT DEFAULT NULL
)
RETURNS TABLE (user_id UUID, autor_nome TEXT, xp INTEGER, motivo TEXT, fonte_tipo TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, autor_nome, xp, motivo, fonte_tipo, created_at
  FROM agora_xp_ledger
  WHERE (p_antes_de IS NULL OR created_at < p_antes_de)
    AND (p_fonte_tipo IS NULL OR fonte_tipo = p_fonte_tipo)
  ORDER BY created_at DESC
  LIMIT LEAST(GREATEST(p_limite, 1), 100);
$$;

-- ── Fim da migração v17 ─────────────────────────────────────────────────
