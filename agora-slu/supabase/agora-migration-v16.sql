-- =====================================================================
-- ÁGORA (SLU) — Migração v16
-- 1) Sistema de Conquistas (o "drop" cosmético): badges que só
--    desbloqueiam quando o critério real é cumprido — nunca por
--    autodeclaração/clique, mesma lógica da correção de missões (v12).
--    Sem XP embutido de propósito (fica só cosmético/de status — ver
--    decisão registrada na conversa: dar XP por "sorte" contradiz o
--    próprio propósito investigativo do Pró-Vida sobre recompensa
--    variável manipuladora).
--
-- 2) Perfil dinâmico: bio livre + título ativo (uma conquista
--    desbloqueada, escolhida pelo próprio usuário pra exibir).
--
-- 3) CORREÇÃO DE SEGURANÇA CRÍTICA achada de graça enquanto eu mexia
--    no perfil: a policy "agora_profiles_update_own" permite UPDATE na
--    própria linha SEM restringir quais colunas — isso significa que
--    HOJE qualquer usuário logado pode abrir o console do navegador e
--    rodar sb.from('agora_profiles').update({xp: 999999, is_admin: true})
--    e se dar XP infinito ou virar admin. Trava isso via GRANT de coluna
--    (Postgres respeita granularidade de coluna em UPDATE mesmo com RLS
--    de linha liberando) — só a coluna "bio" fica editável direto pelo
--    cliente; xp/grau/streak/is_admin/titulo_ativo_id só mudam via RPC
--    SECURITY DEFINER, como o resto do sistema já faz.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v15.
-- =====================================================================

-- ── 1) Catálogo de conquistas (precisa existir antes do FK do perfil) ──
CREATE TABLE IF NOT EXISTS public.agora_conquistas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave          TEXT NOT NULL UNIQUE,
  nome           TEXT NOT NULL,
  descricao      TEXT,
  icone          TEXT NOT NULL DEFAULT '🏅',
  raridade       TEXT NOT NULL DEFAULT 'comum' CHECK (raridade IN ('comum','rara','epica','lendaria')),
  criterio_tipo  TEXT NOT NULL,
  criterio_valor INTEGER NOT NULL DEFAULT 1,
  xp_bonus       INTEGER NOT NULL DEFAULT 0,
  ativo          BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agora_conquistas_desbloqueadas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conquista_id   UUID NOT NULL REFERENCES public.agora_conquistas(id) ON DELETE CASCADE,
  desbloqueada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, conquista_id)
);

ALTER TABLE public.agora_conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_conquistas_desbloqueadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agora_conquistas_select_all" ON public.agora_conquistas;
CREATE POLICY "agora_conquistas_select_all" ON public.agora_conquistas
  FOR SELECT USING (auth.role() = 'authenticated' AND ativo);
DROP POLICY IF EXISTS "agora_conquistas_admin_all" ON public.agora_conquistas;
CREATE POLICY "agora_conquistas_admin_all" ON public.agora_conquistas
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "agora_conquistas_desbloqueadas_select_all" ON public.agora_conquistas_desbloqueadas;
CREATE POLICY "agora_conquistas_desbloqueadas_select_all" ON public.agora_conquistas_desbloqueadas
  FOR SELECT USING (auth.role() = 'authenticated');
-- Sem policy de INSERT pro usuário comum: só desbloqueia via
-- verificar_conquistas() (SECURITY DEFINER), nunca por insert direto.

-- ── 2) Perfil dinâmico: bio + título ativo ──────────────────────────────
ALTER TABLE public.agora_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.agora_profiles ADD COLUMN IF NOT EXISTS titulo_ativo_id UUID REFERENCES public.agora_conquistas(id);

DO $$ BEGIN
  ALTER TABLE public.agora_profiles ADD CONSTRAINT agora_profiles_bio_tamanho CHECK (char_length(bio) <= 280) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3) Trava a policy aberta de agora_profiles (agora que "bio" existe) ─
REVOKE UPDATE ON public.agora_profiles FROM authenticated;
GRANT UPDATE (bio) ON public.agora_profiles TO authenticated;

-- ── Catálogo inicial de conquistas ──────────────────────────────────────
INSERT INTO public.agora_conquistas (chave, nome, descricao, icone, raridade, criterio_tipo, criterio_valor) VALUES
  ('primeira_ficha',   'Primeiro Registro',       'Enviou sua primeira Ficha Pró-Vida.',                     '📋', 'comum',    'ficha_provida_count',      1),
  ('investigador_5',   'Investigador Dedicado',   'Enviou 5 Fichas Pró-Vida.',                                '🔎', 'rara',     'ficha_provida_count',      5),
  ('arquivista_10',    'Arquivista',              'Registrou 10 notas de investigação.',                      '🗂️', 'rara',     'investigacao_nota_count', 10),
  ('cidadao_1',        'Cidadão da Ágora',        'Votou pela primeira vez num Decreto do Conselho.',         '🏛️', 'comum',    'voto_decreto_count',       1),
  ('conselheiro_5',    'Voz do Conselho',         'Votou em 5 Decretos do Conselho.',                         '⚖️', 'rara',     'voto_decreto_count',       5),
  ('tarefeiro_1',      'Mão na Obra',             'Concluiu sua primeira tarefa do Quadro de Voluntários.',   '🛠️', 'comum',    'tarefa_concluida_count',   1),
  ('cronista_1',       'Cronista',                'Escreveu uma nota de margem no Códice Caelestis.',         '📖', 'comum',    'codex_nota_count',         1),
  ('chama_7',          'Chama Constante',         'Manteve uma sequência de 7 dias ativos.',                  '🔥', 'rara',     'streak_atual',             7),
  ('chama_30',         'Chama Eterna',            'Manteve uma sequência de 30 dias ativos.',                 '💎', 'epica',    'streak_recorde',          30),
  ('buscador_aeon',    'Buscador do Æon',         'Enviou um pedido de ingresso no Novo Æon.',                '✦',  'rara',     'aeon_pedido',              1),
  ('sorteado_modulo',  'Sorteado',                'Recebeu um módulo Pró-Vida para investigar.',              '🎲', 'comum',    'modulo_atribuido',         1),
  ('conselheiro_grau', 'Conselheiro',             'Alcançou o Grau 3 — Conselheiro.',                         '👑', 'lendaria', 'grau_atual',               3)
ON CONFLICT (chave) DO NOTHING;

-- ── Verifica e desbloqueia conquistas cumpridas ────────────────────────
-- Idempotente e só roda pra quem chama pela própria sessão. Sem XP por
-- padrão (ver nota no topo) — a coluna xp_bonus existe pra flexibilidade
-- futura do admin, mas o catálogo semeado acima fica todo em 0.
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

    valor_atual := CASE c.criterio_tipo
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

-- ── Define (ou limpa) o título ativo do perfil ─────────────────────────
-- Valida que a conquista pertence mesmo ao usuário antes de deixar
-- exibi-la — evita alguém "equipar" um título que não desbloqueou.
CREATE OR REPLACE FUNCTION public.definir_titulo_perfil(uid UUID, p_conquista_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  possui BOOLEAN;
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Não autorizado.');
  END IF;

  IF p_conquista_id IS NULL THEN
    UPDATE agora_profiles SET titulo_ativo_id = NULL WHERE id = uid;
    RETURN json_build_object('ok', true);
  END IF;

  SELECT EXISTS(SELECT 1 FROM agora_conquistas_desbloqueadas WHERE user_id = uid AND conquista_id = p_conquista_id) INTO possui;
  IF NOT possui THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Você ainda não desbloqueou essa conquista.');
  END IF;

  UPDATE agora_profiles SET titulo_ativo_id = p_conquista_id WHERE id = uid;
  RETURN json_build_object('ok', true);
END;
$$;

-- ── Fim da migração v16 ─────────────────────────────────────────────────
