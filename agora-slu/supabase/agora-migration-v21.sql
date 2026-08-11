-- =====================================================================
-- ÁGORA (SLU) — Migração v21
-- Quatro aprimoramentos sobre a Câmara do Æon (v19/v20):
--
-- 1) CONQUISTAS DO ÆON: reaproveita o motor genérico de conquistas
--    (calcular_valor_criterio, já usado por todo o resto do site — ver
--    v16/v17) em vez de inventar um sistema paralelo. Três novas:
--    ser aceito, fechar o Selo de Experiência, e alcançar Nível 6.
--    Continuam só cosméticas (sem xp_bonus), mesma filosofia da v16.
--
-- 2) NOTIFICAR GUARDIÕES: hoje eles só descobrem monografia nova ou
--    termo de glossário proposto entrando manualmente no painel.
--    Vira gatilho automático (mesmo padrão AFTER INSERT da v8), com
--    uma função compartilhada notificar_guardioes_aeon() pra não
--    duplicar a lógica entre os dois gatilhos + o reenvio abaixo.
--
-- 3) REENVIO DE MONOGRAFIA: quem tirou nota baixa (<6) pode reenviar
--    uma versão melhorada em vez de ficar travado pra sempre. A versão
--    anterior (conteúdo + nota + comentário do admin) fica guardada em
--    "historico" — os pontos já concedidos pela primeira avaliação não
--    são retirados (já foram ganhos pelo esforço), a nova avaliação só
--    soma por cima.
--
-- 4) LIMITE LEVE CONTRA SPAM: enviar_monografia_aeon (RPC) ganha uma
--    checagem de janela de tempo; proposta de termo de glossário (hoje
--    um insert direto do cliente, não RPC) ganha um gatilho BEFORE
--    INSERT equivalente. Limites generosos de propósito — não é anti-
--    abuso pesado, só um freio contra automação.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v20.
-- =====================================================================

-- ── 1) Conquistas do Æon ─────────────────────────────────────────────
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
    WHEN 'aeon_aceito'             THEN (SELECT COUNT(*)::int FROM agora_aeon_membros WHERE user_id = uid)
    WHEN 'aeon_selo_estagio'       THEN (SELECT COALESCE(selo_estagio, 0) FROM agora_aeon_membros WHERE user_id = uid)
    WHEN 'aeon_nivel'              THEN (SELECT COALESCE(nivel, 1) FROM agora_aeon_membros WHERE user_id = uid)
    ELSE 0
  END;
END;
$$;

INSERT INTO public.agora_conquistas (chave, nome, descricao, icone, raridade, criterio_tipo, criterio_valor) VALUES
  ('aeon_iniciado',    'Tijolo na Estrutura', 'Foi aceito como Iniciado no Novo Æon.',                                 '✦', 'rara',     'aeon_aceito',       1),
  ('aeon_selo_pleno',  'Selo Completo',       'Fechou o pentagrama do Selo de Experiência ajudando outros Iniciados.', '🜁', 'epica',    'aeon_selo_estagio', 5),
  ('aeon_nivel_pleno', 'Iniciado Pleno',      'Alcançou o Nível 6 — o grau noemático mais alto da Câmara.',           '☉', 'lendaria', 'aeon_nivel',        6)
ON CONFLICT (chave) DO NOTHING;

-- ── 2) Notificar Guardiões automaticamente ──────────────────────────
CREATE OR REPLACE FUNCTION public.notificar_guardioes_aeon(p_mensagem TEXT, p_link TEXT, p_excluir UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g RECORD;
BEGIN
  FOR g IN SELECT id FROM agora_profiles WHERE (is_guardiao_aeon OR is_admin) AND (p_excluir IS NULL OR id <> p_excluir) LOOP
    INSERT INTO agora_notificacoes (user_id, tipo, mensagem, link) VALUES (g.id, 'aeon_guardiao', p_mensagem, p_link);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_notificar_guardioes_monografia() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM notificar_guardioes_aeon(
    'Nova monografia pra avaliar: "' || NEW.titulo || '"',
    'aeon-monografia.html?id=' || NEW.id::text,
    NEW.user_id
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_monografia_enviada_notificar ON public.agora_aeon_monografias;
CREATE TRIGGER on_monografia_enviada_notificar AFTER INSERT ON public.agora_aeon_monografias
  FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_guardioes_monografia();

CREATE OR REPLACE FUNCTION public.trg_notificar_guardioes_glossario() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM notificar_guardioes_aeon(
    'Novo termo proposto ao Glossário: "' || NEW.termo || '"',
    'camara-aeon.html',
    NEW.proposto_por
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_termo_glossario_proposto ON public.agora_aeon_glossario;
CREATE TRIGGER on_termo_glossario_proposto AFTER INSERT ON public.agora_aeon_glossario
  FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_guardioes_glossario();

-- ── 3) Reenvio de monografia com nota baixa ─────────────────────────
ALTER TABLE public.agora_aeon_monografias ADD COLUMN IF NOT EXISTS historico JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.reenviar_monografia_aeon(
  uid UUID, p_monografia_id UUID, p_titulo TEXT, p_conteudo TEXT, p_midias JSONB, p_esquema TEXT
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_titulo TEXT := NULLIF(trim(p_titulo), '');
  v_conteudo TEXT := NULLIF(trim(p_conteudo), '');
  mono RECORD;
  versao_anterior JSONB;
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Não autorizado.');
  END IF;
  IF v_titulo IS NULL OR v_conteudo IS NULL THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Título e conteúdo são obrigatórios.');
  END IF;

  SELECT * INTO mono FROM agora_aeon_monografias WHERE id = p_monografia_id;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'mensagem', 'Monografia não encontrada.'); END IF;
  IF mono.user_id <> uid THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Essa monografia não é sua.');
  END IF;
  IF mono.status <> 'avaliada' OR mono.nota_admin IS NULL OR mono.nota_admin >= 6 THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Só dá pra reenviar uma monografia já avaliada com nota abaixo de 6.');
  END IF;

  versao_anterior := jsonb_build_object(
    'titulo', mono.titulo, 'conteudo', mono.conteudo, 'midias', mono.midias, 'esquema', mono.esquema,
    'nota_admin', mono.nota_admin, 'comentario_admin', mono.comentario_admin, 'avaliado_em', now()
  );

  UPDATE agora_aeon_monografias SET
    titulo = v_titulo, conteudo = v_conteudo, midias = COALESCE(p_midias, '[]'::jsonb), esquema = p_esquema,
    status = 'em_avaliacao', nota_admin = NULL, comentario_admin = NULL, pontos_concedidos = 0,
    historico = mono.historico || versao_anterior
  WHERE id = p_monografia_id;

  PERFORM notificar_guardioes_aeon(
    'Nova versão enviada de "' || v_titulo || '" — a anterior tinha nota ' || mono.nota_admin || '/10.',
    'aeon-monografia.html?id=' || p_monografia_id::text,
    uid
  );

  RETURN json_build_object('ok', true);
END;
$$;

-- ── 4) Limite leve contra spam ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enviar_monografia_aeon(uid UUID, p_titulo TEXT, p_conteudo TEXT, p_midias JSONB, p_esquema TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  titulo TEXT := NULLIF(trim(p_titulo), '');
  conteudo TEXT := NULLIF(trim(p_conteudo), '');
  nome TEXT;
  recentes INTEGER;
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

  SELECT COUNT(*) INTO recentes FROM agora_aeon_monografias WHERE user_id = uid AND created_at > now() - interval '24 hours';
  IF recentes >= 5 THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Você já enviou várias monografias nas últimas 24h. Espere um pouco antes de enviar outra.');
  END IF;

  SELECT nome_exibicao INTO nome FROM agora_profiles WHERE id = uid;

  INSERT INTO agora_aeon_monografias (user_id, autor_nome, titulo, conteudo, midias, esquema)
  VALUES (uid, nome, titulo, conteudo, COALESCE(p_midias, '[]'::jsonb), p_esquema)
  RETURNING * INTO nova;

  RETURN json_build_object('ok', true, 'id', nova.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_rate_limit_glossario() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recentes INTEGER;
BEGIN
  SELECT COUNT(*) INTO recentes FROM agora_aeon_glossario WHERE proposto_por = NEW.proposto_por AND created_at > now() - interval '1 hour';
  IF recentes >= 10 THEN
    RAISE EXCEPTION 'Você propôs termos demais na última hora. Espere um pouco antes de propor outro.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_termo_glossario_rate_limit ON public.agora_aeon_glossario;
CREATE TRIGGER on_termo_glossario_rate_limit BEFORE INSERT ON public.agora_aeon_glossario
  FOR EACH ROW EXECUTE FUNCTION public.trg_rate_limit_glossario();

-- ── Fim da migração v21 ─────────────────────────────────────────────────
