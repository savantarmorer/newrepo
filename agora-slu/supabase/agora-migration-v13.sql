-- =====================================================================
-- ÁGORA (SLU) — Migração v13
-- Distribuição de módulos Pró-Vida: cada Iniciado que entra na
-- investigação recebe, na hora, um módulo (pasta de apostilas) sorteado
-- entre os disponíveis — priorizando os módulos com menos analistas no
-- momento, pra cobertura não empilhar todo mundo no mesmo módulo. A
-- atribuição fica registrada numa tabela visível a qualquer Iniciado
-- autenticado: quem está analisando qual módulo, desde quando.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v12.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.agora_provida_modulos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL UNIQUE,
  link_drive  TEXT NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.agora_provida_modulos (nome, link_drive) VALUES
  ('Introdução', 'https://drive.google.com/drive/folders/1rnfaQR2lyijkxr5tLj_q8DCtjSxwAIBW?usp=sharing'),
  ('Básico 01', 'https://drive.google.com/drive/folders/1SKv4e_RxedrBE0sUcSz_GEWi-gw7VyPy?usp=sharing'),
  ('Avançado 1', 'https://drive.google.com/drive/folders/15zESPgiGizqrvgLOf7PtwIQI0EdOT_nK?usp=sharing'),
  ('Avançado 2', 'https://drive.google.com/drive/folders/1w1gbituUoYlp6JuUU9Ae8tGizhnUqwWW?usp=sharing'),
  ('Avançado 3', 'https://drive.google.com/drive/folders/12jHKqi9aDnRwHoOwYK3Thd843_-7ffgl?usp=sharing'),
  ('Avançado 4', 'https://drive.google.com/drive/folders/1sFTJMJLv_aG8dTglqWqyxs_k5579yooe?usp=sharing'),
  ('Avançado 5', 'https://drive.google.com/drive/folders/1G_obyix2dkRbj1_MuGjsPrc_-fS3EKAC?usp=sharing'),
  ('Avançado 6', 'https://drive.google.com/drive/folders/1KBz963nNCdFXN_aRoyQ3z0fVhd-tsBHO?usp=sharing')
ON CONFLICT (nome) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.agora_provida_atribuicoes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  modulo_id      UUID NOT NULL REFERENCES public.agora_provida_modulos(id),
  analista_nome  TEXT,
  atribuido_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agora_provida_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_provida_atribuicoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agora_provida_modulos_select_all" ON public.agora_provida_modulos;
CREATE POLICY "agora_provida_modulos_select_all" ON public.agora_provida_modulos
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "agora_provida_modulos_admin_all" ON public.agora_provida_modulos;
CREATE POLICY "agora_provida_modulos_admin_all" ON public.agora_provida_modulos
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "agora_provida_atribuicoes_select_all" ON public.agora_provida_atribuicoes;
CREATE POLICY "agora_provida_atribuicoes_select_all" ON public.agora_provida_atribuicoes
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "agora_provida_atribuicoes_admin_all" ON public.agora_provida_atribuicoes;
CREATE POLICY "agora_provida_atribuicoes_admin_all" ON public.agora_provida_atribuicoes
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
-- Sem policy de INSERT pra usuário comum: a atribuição só acontece via
-- atribuir_modulo_provida() (SECURITY DEFINER), nunca por insert direto.

-- ── Sorteio ─────────────────────────────────────────────────────────────
-- Se o Iniciado já tem módulo, devolve o mesmo (idempotente — não sorteia
-- de novo a cada visita). Senão, sorteia entre os módulos ativos com
-- menos analistas atribuídos agora (random() como desempate).
CREATE OR REPLACE FUNCTION public.atribuir_modulo_provida(uid UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  existente RECORD;
  escolhido RECORD;
  nome_analista TEXT;
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Não autorizado.');
  END IF;

  SELECT a.modulo_id, m.nome AS modulo_nome, m.link_drive INTO existente
    FROM agora_provida_atribuicoes a JOIN agora_provida_modulos m ON m.id = a.modulo_id
    WHERE a.user_id = uid;
  IF FOUND THEN
    RETURN json_build_object('ok', true, 'ja_atribuido', true, 'modulo_id', existente.modulo_id,
      'modulo_nome', existente.modulo_nome, 'link_drive', existente.link_drive);
  END IF;

  SELECT m.* INTO escolhido
    FROM agora_provida_modulos m
    LEFT JOIN (
      SELECT modulo_id, COUNT(*) AS n FROM agora_provida_atribuicoes GROUP BY modulo_id
    ) c ON c.modulo_id = m.id
    WHERE m.ativo
    ORDER BY COALESCE(c.n, 0) ASC, random()
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Nenhum módulo Pró-Vida disponível no momento.');
  END IF;

  SELECT COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
    INTO nome_analista FROM auth.users WHERE id = uid;

  INSERT INTO agora_provida_atribuicoes (user_id, modulo_id, analista_nome)
  VALUES (uid, escolhido.id, nome_analista);

  RETURN json_build_object('ok', true, 'ja_atribuido', false, 'modulo_id', escolhido.id,
    'modulo_nome', escolhido.nome, 'link_drive', escolhido.link_drive);
END;
$$;

-- ── Fim da migração v13 ─────────────────────────────────────────────────
