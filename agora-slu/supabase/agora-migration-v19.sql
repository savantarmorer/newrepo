-- =====================================================================
-- ÁGORA (SLU) — Migração v19
-- Câmara do Æon: área separada, visível SÓ para quem foi aceito
-- manualmente (agora_aeon_applications.status = 'aceito' já era esse
-- mecanismo — a Câmara reaproveita ele como fonte de autorização).
--
-- Estrutura extraída do próprio texto do Novo Æon:
--   • "colocar seu tijolo... arquitetos da eterna estrutura" → O Muro
--     (tabela dedicada agora_aeon_membros, separada de
--     agora_aeon_applications porque essa última guarda telefone/e-mail
--     que continuam privados — só o necessário pro Muro fica visível
--     aos outros Iniciados).
--   • "esse será seu primeiro exercício Noemático" (implica que existem
--     mais) → sequência de Exercícios Noemáticos com resposta de cada
--     Iniciado.
--   • "mantê-los em seu glossário mental (outra prática que será
--     explicada no devido momento)" → Glossário Noemático colaborativo,
--     com as "duas vertentes interpretativas" (prática e esotérica)
--     que o texto menciona explicitamente.
--   • "Um Guardião do Æon vai ler sua expressão" → papel leve de
--     curadoria (is_guardiao_aeon), não uma hierarquia de poder no
--     site — só quem pode propor exercícios e aprovar termos do
--     glossário.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v18.
-- =====================================================================

ALTER TABLE public.agora_profiles ADD COLUMN IF NOT EXISTS is_guardiao_aeon BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.agora_profiles ADD COLUMN IF NOT EXISTS titulo_sincromatico TEXT;

-- ── O Muro: quem foi aceito, seu tijolo (expressão) e título ───────────
-- (criada ANTES das funções de autorização abaixo, porque is_aeon_iniciado()
-- referencia esta tabela e o Postgres valida o corpo da função contra os
-- objetos já existentes no momento do CREATE FUNCTION.)
CREATE TABLE IF NOT EXISTS public.agora_aeon_membros (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_exibicao        TEXT,
  expressao            TEXT,
  titulo_sincromatico  TEXT,
  aceito_em            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Funções de autorização (mesmo padrão de is_admin_user()) ───────────
CREATE OR REPLACE FUNCTION public.is_aeon_iniciado()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM agora_aeon_membros WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_guardiao_aeon()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT is_guardiao_aeon FROM agora_profiles WHERE id = auth.uid()), false) OR is_admin_user();
$$;

ALTER TABLE public.agora_aeon_membros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agora_aeon_membros_select" ON public.agora_aeon_membros;
CREATE POLICY "agora_aeon_membros_select" ON public.agora_aeon_membros
  FOR SELECT USING (is_aeon_iniciado() OR is_admin_user());
-- Sem policy de insert/update direta — só via aceitar_iniciado_aeon() abaixo.

-- ── Exercícios Noemáticos (sequência, curada por Guardiões) ─────────────
CREATE TABLE IF NOT EXISTS public.agora_aeon_exercicios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero     INTEGER NOT NULL,
  titulo     TEXT NOT NULL,
  prompt     TEXT NOT NULL,
  ativo      BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agora_aeon_exercicios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agora_aeon_exercicios_select" ON public.agora_aeon_exercicios;
CREATE POLICY "agora_aeon_exercicios_select" ON public.agora_aeon_exercicios
  FOR SELECT USING (is_aeon_iniciado() OR is_admin_user());
DROP POLICY IF EXISTS "agora_aeon_exercicios_guardiao_all" ON public.agora_aeon_exercicios;
CREATE POLICY "agora_aeon_exercicios_guardiao_all" ON public.agora_aeon_exercicios
  FOR ALL USING (is_guardiao_aeon()) WITH CHECK (is_guardiao_aeon());

-- Primeiro exercício já existe no texto de introdução — semeado aqui
-- pra Câmara não abrir vazia.
INSERT INTO public.agora_aeon_exercicios (numero, titulo, prompt)
SELECT 1, 'O Ritual da Lua',
  'Aguarde uma noite clara, com a lua visível. Encare-a até a imagem negativa ficar queimada na retina. Feche os olhos, projete-se até a lua — não como indivíduo, seja a cratera. Regresse ao momento de sua formação. Quando visualizar o impacto, retorne com a mente limpa e pense na palavra Æon — não no significado, na forma. Escreva o que descobriu. Não importa a extensão.'
WHERE NOT EXISTS (SELECT 1 FROM public.agora_aeon_exercicios WHERE numero = 1);

-- ── Respostas aos exercícios (uma por Iniciado por exercício) ──────────
CREATE TABLE IF NOT EXISTS public.agora_aeon_respostas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio_id UUID NOT NULL REFERENCES public.agora_aeon_exercicios(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resposta     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exercicio_id, user_id)
);
ALTER TABLE public.agora_aeon_respostas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agora_aeon_respostas_select" ON public.agora_aeon_respostas;
CREATE POLICY "agora_aeon_respostas_select" ON public.agora_aeon_respostas
  FOR SELECT USING (is_aeon_iniciado() OR is_admin_user());
DROP POLICY IF EXISTS "agora_aeon_respostas_insert_own" ON public.agora_aeon_respostas;
CREATE POLICY "agora_aeon_respostas_insert_own" ON public.agora_aeon_respostas
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_aeon_iniciado());

-- ── Glossário Noemático (proposto por Iniciados, aprovado por Guardiões) ─
CREATE TABLE IF NOT EXISTS public.agora_aeon_glossario (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  termo                  TEXT NOT NULL,
  interpretacao_pratica  TEXT,
  interpretacao_esoterica TEXT,
  proposto_por           UUID NOT NULL REFERENCES auth.users(id),
  proponente_nome        TEXT,
  aprovado               BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agora_aeon_glossario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agora_aeon_glossario_select" ON public.agora_aeon_glossario;
CREATE POLICY "agora_aeon_glossario_select" ON public.agora_aeon_glossario
  FOR SELECT USING (
    (is_aeon_iniciado() AND aprovado) OR auth.uid() = proposto_por OR is_guardiao_aeon()
  );
DROP POLICY IF EXISTS "agora_aeon_glossario_insert_own" ON public.agora_aeon_glossario;
CREATE POLICY "agora_aeon_glossario_insert_own" ON public.agora_aeon_glossario
  FOR INSERT WITH CHECK (auth.uid() = proposto_por AND is_aeon_iniciado());
DROP POLICY IF EXISTS "agora_aeon_glossario_guardiao_write" ON public.agora_aeon_glossario;
CREATE POLICY "agora_aeon_glossario_guardiao_write" ON public.agora_aeon_glossario
  FOR UPDATE USING (is_guardiao_aeon()) WITH CHECK (is_guardiao_aeon());
DROP POLICY IF EXISTS "agora_aeon_glossario_guardiao_delete" ON public.agora_aeon_glossario;
CREATE POLICY "agora_aeon_glossario_guardiao_delete" ON public.agora_aeon_glossario
  FOR DELETE USING (is_guardiao_aeon());

-- ── Aceitar um pedido como Iniciado do Æon (admin/Guardião) ────────────
-- Faz as duas coisas junto: marca a candidatura como aceita e cria a
-- linha pública (dentro do círculo) no Muro — sem isso a pessoa nunca
-- passaria a ser reconhecida por is_aeon_iniciado().
CREATE OR REPLACE FUNCTION public.aceitar_iniciado_aeon(quem UUID, p_application_id UUID, p_titulo_sincromatico TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pedido RECORD;
BEGIN
  IF quem IS DISTINCT FROM auth.uid() OR NOT is_guardiao_aeon() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Só um Guardião do Æon pode aceitar iniciados.');
  END IF;

  SELECT * INTO pedido FROM agora_aeon_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Pedido não encontrado.');
  END IF;

  UPDATE agora_aeon_applications SET status = 'aceito' WHERE id = p_application_id;

  INSERT INTO agora_aeon_membros (user_id, nome_exibicao, expressao, titulo_sincromatico)
  VALUES (pedido.user_id, pedido.nome, pedido.expressao, NULLIF(trim(p_titulo_sincromatico), ''))
  ON CONFLICT (user_id) DO UPDATE SET
    expressao = EXCLUDED.expressao,
    titulo_sincromatico = COALESCE(EXCLUDED.titulo_sincromatico, agora_aeon_membros.titulo_sincromatico);

  UPDATE agora_profiles SET titulo_sincromatico = NULLIF(trim(p_titulo_sincromatico), '') WHERE id = pedido.user_id;

  INSERT INTO agora_notificacoes (user_id, tipo, mensagem, link)
  VALUES (pedido.user_id, 'aeon', 'Seu tijolo foi aceito na estrutura do Novo Æon. A Câmara está aberta.', 'novo-aeon.html');

  RETURN json_build_object('ok', true);
END;
$$;

-- ── Conceder/revogar o papel de Guardião (só admin do site) ────────────
CREATE OR REPLACE FUNCTION public.definir_guardiao_aeon(quem UUID, alvo_id UUID, valor BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF quem IS DISTINCT FROM auth.uid() OR NOT is_admin_user() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Só um administrador pode fazer isso.');
  END IF;
  UPDATE agora_profiles SET is_guardiao_aeon = valor WHERE id = alvo_id;
  RETURN json_build_object('ok', true);
END;
$$;

-- ── Registrar a resposta de um Iniciado a um exercício ──────────────────
CREATE OR REPLACE FUNCTION public.responder_exercicio_aeon(uid UUID, p_exercicio_id UUID, p_resposta TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  texto TEXT := NULLIF(trim(p_resposta), '');
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

  INSERT INTO agora_aeon_respostas (exercicio_id, user_id, resposta)
  VALUES (p_exercicio_id, uid, texto)
  ON CONFLICT (exercicio_id, user_id) DO UPDATE SET resposta = EXCLUDED.resposta, created_at = now();

  RETURN json_build_object('ok', true);
END;
$$;

-- ── Fim da migração v19 ─────────────────────────────────────────────────
