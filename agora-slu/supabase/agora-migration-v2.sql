-- =====================================================================
-- ÁGORA (SLU) — Migração v2
-- Substitui todo comportamento simulado (Terminal ARG, Governança,
-- Evidências, Missões, Hall das Lendas, Códice) por dados reais.
-- Execute DEPOIS de supabase/agora-migration.sql.
-- =====================================================================

-- Garante as funções gen_random_uuid()/digest() usadas abaixo
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Helper: calcula grau a partir do XP (mesma escala do js/agoraAuth.js) ─
CREATE OR REPLACE FUNCTION public.calcular_grau_agora(p_xp INTEGER)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_xp >= 2000 THEN 3
    WHEN p_xp >= 500  THEN 2
    WHEN p_xp >= 100  THEN 1
    ELSE 0
  END;
$$;

-- =====================================================================
-- 1. TERMINAL ARG — puzzles reais com resposta guardada fora do alcance
--    do cliente (sem policy de SELECT em agora_arg_answers).
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.agora_arg_puzzles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco      TEXT UNIQUE NOT NULL,     -- 'BLOCO_01'
  titulo     TEXT NOT NULL,
  pergunta   TEXT NOT NULL,
  xp_reward  INTEGER NOT NULL DEFAULT 500,
  ordem      INTEGER NOT NULL DEFAULT 1,
  ativo      BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela-cofre: guarda o hash da resposta. RLS ativado SEM nenhuma policy
-- de SELECT/INSERT/UPDATE para authenticated/anon — só é lida pela função
-- SECURITY DEFINER abaixo (que roda como dono da tabela, ignorando RLS).
CREATE TABLE IF NOT EXISTS public.agora_arg_answers (
  puzzle_id      UUID PRIMARY KEY REFERENCES public.agora_arg_puzzles(id) ON DELETE CASCADE,
  resposta_hash  TEXT NOT NULL   -- sha256 hex da resposta normalizada (upper+trim)
);

CREATE TABLE IF NOT EXISTS public.agora_arg_solves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id  UUID NOT NULL REFERENCES public.agora_arg_puzzles(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solved_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (puzzle_id, user_id)
);

ALTER TABLE public.agora_arg_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_arg_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_arg_solves  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_arg_puzzles_select_all" ON public.agora_arg_puzzles
  FOR SELECT USING (auth.role() = 'authenticated' AND ativo);
CREATE POLICY "agora_arg_solves_select_own" ON public.agora_arg_solves
  FOR SELECT USING (auth.uid() = user_id);
-- agora_arg_answers: nenhuma policy → inacessível via API REST/cliente.

-- Resolve um puzzle: compara hash, registra resolução (idempotente),
-- concede XP uma única vez e recalcula o grau.
CREATE OR REPLACE FUNCTION public.resolver_puzzle_arg(uid UUID, p_puzzle_id UUID, p_resposta TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  hash_correto TEXT;
  ja_resolvido BOOLEAN;
  puzzle RECORD;
  novo_xp INTEGER;
BEGIN
  SELECT * INTO puzzle FROM agora_arg_puzzles WHERE id = p_puzzle_id AND ativo;
  IF NOT FOUND THEN
    RETURN json_build_object('correto', false, 'mensagem', 'Bloco inexistente ou inativo.');
  END IF;

  SELECT resposta_hash INTO hash_correto FROM agora_arg_answers WHERE puzzle_id = p_puzzle_id;
  IF hash_correto IS NULL OR encode(digest(upper(trim(p_resposta)), 'sha256'), 'hex') <> hash_correto THEN
    RETURN json_build_object('correto', false, 'mensagem', 'Chave rejeitada pelo Daemon Umbra-Kael.');
  END IF;

  SELECT EXISTS(SELECT 1 FROM agora_arg_solves WHERE puzzle_id = p_puzzle_id AND user_id = uid) INTO ja_resolvido;

  IF NOT ja_resolvido THEN
    INSERT INTO agora_arg_solves (puzzle_id, user_id) VALUES (p_puzzle_id, uid);
    UPDATE agora_profiles SET xp = xp + puzzle.xp_reward WHERE id = uid RETURNING xp INTO novo_xp;
    UPDATE agora_profiles SET grau = calcular_grau_agora(novo_xp) WHERE id = uid;
  END IF;

  RETURN json_build_object(
    'correto', true,
    'ja_resolvido_antes', ja_resolvido,
    'xp_ganho', CASE WHEN ja_resolvido THEN 0 ELSE puzzle.xp_reward END,
    'mensagem', 'Chave daemônica reconhecida. Bloco decifrado.'
  );
END;
$$;

-- Progresso coletivo por bloco (contagem agregada, sem expor quem resolveu)
CREATE OR REPLACE FUNCTION public.obter_progresso_arg()
RETURNS TABLE (bloco TEXT, titulo TEXT, xp_reward INTEGER, total_solves BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT p.bloco, p.titulo, p.xp_reward, COUNT(s.id)
  FROM agora_arg_puzzles p
  LEFT JOIN agora_arg_solves s ON s.puzzle_id = p.id
  WHERE p.ativo
  GROUP BY p.id
  ORDER BY p.ordem;
$$;

-- Seed: BLOCO_01 (resposta: "EGREGORA" — normalizada maiúscula sem acento)
INSERT INTO public.agora_arg_puzzles (bloco, titulo, pergunta, xp_reward, ordem)
VALUES ('BLOCO_01', 'manifest_1998.enc',
  'HASH: 5b2c6f-d4af37-0f0e17-161426-221f3b — Insira o Palimpsesto da Chave (uma palavra).',
  500, 1)
ON CONFLICT (bloco) DO NOTHING;

INSERT INTO public.agora_arg_answers (puzzle_id, resposta_hash)
SELECT id, encode(digest('EGREGORA', 'sha256'), 'hex') FROM public.agora_arg_puzzles WHERE bloco = 'BLOCO_01'
ON CONFLICT (puzzle_id) DO NOTHING;

-- =====================================================================
-- 2. GOVERNANÇA — decretos e votos reais (um voto por usuário, editável)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.agora_decrees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero     INTEGER NOT NULL,
  titulo     TEXT NOT NULL,
  descricao  TEXT,
  proponente TEXT,
  quorum_min INTEGER NOT NULL DEFAULT 60,
  status     TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','aprovado','rejeitado')),
  abre_em    TIMESTAMPTZ DEFAULT now(),
  fecha_em   TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agora_decree_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decree_id  UUID NOT NULL REFERENCES public.agora_decrees(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  escolha    TEXT NOT NULL CHECK (escolha IN ('sim','nao','abster')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (decree_id, user_id)
);

ALTER TABLE public.agora_decrees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_decree_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_decrees_select_all" ON public.agora_decrees
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "agora_decree_votes_select_own" ON public.agora_decree_votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.votar_decreto(uid UUID, p_decree_id UUID, p_escolha TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d RECORD;
BEGIN
  IF p_escolha NOT IN ('sim','nao','abster') THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Escolha inválida.');
  END IF;

  SELECT * INTO d FROM agora_decrees WHERE id = p_decree_id;
  IF NOT FOUND OR d.status <> 'aberto' OR now() > d.fecha_em THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Este decreto não está mais aberto à votação.');
  END IF;

  INSERT INTO agora_decree_votes (decree_id, user_id, escolha)
  VALUES (p_decree_id, uid, p_escolha)
  ON CONFLICT (decree_id, user_id) DO UPDATE SET escolha = EXCLUDED.escolha, created_at = now();

  RETURN json_build_object('ok', true, 'mensagem', 'Voto registrado no Livro do Conselho.');
END;
$$;

-- Apuração agregada (sem expor quem votou o quê)
CREATE OR REPLACE FUNCTION public.obter_tally_decreto(p_decree_id UUID)
RETURNS TABLE (escolha TEXT, total BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT escolha, COUNT(*) FROM agora_decree_votes WHERE decree_id = p_decree_id GROUP BY escolha;
$$;

INSERT INTO public.agora_decrees (numero, titulo, descricao, proponente, quorum_min, fecha_em)
VALUES (44, 'Abertura da Sub-Cripta para Análise de Áudio do Pen Drive',
  'A liberação do áudio permitirá que a equipe de investigações decodifique a frequência de 77Hz.',
  '@Guardião_LuxVael', 60, now() + INTERVAL '14 hours')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 3. EVIDÊNCIAS — cofre real + diário de bordo colaborativo
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.agora_arg_evidence (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo         TEXT NOT NULL,
  titulo         TEXT NOT NULL,
  descricao      TEXT,
  encontrado_em  TEXT,
  status         TEXT NOT NULL DEFAULT 'em_analise' CHECK (status IN ('decifrado','em_analise','confirmado')),
  selo_ref       TEXT DEFAULT 'seal-umbra-kael',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agora_evidence_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.agora_arg_evidence(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nome  TEXT,
  nota        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agora_arg_evidence  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_evidence_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_arg_evidence_select_all" ON public.agora_arg_evidence
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "agora_evidence_notes_select_all" ON public.agora_evidence_notes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "agora_evidence_notes_insert_own" ON public.agora_evidence_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

INSERT INTO public.agora_arg_evidence (codigo, titulo, descricao, encontrado_em, status, selo_ref) VALUES
  ('EVIDÊNCIA #001', 'Serial #9948-ÆON', 'Serial gravado na página 12 do livro SLU.', 'Livro SLU p. 12', 'decifrado', 'seal-umbra-kael'),
  ('EVIDÊNCIA #002', 'Frequência 77Hz', 'Espectrograma de áudio anômalo compartilhado no Discord.', 'Discord #arg', 'em_analise', 'seal-chronos-phanes'),
  ('EVIDÊNCIA #003', 'Cópia do Selo', 'Selo duplicado encontrado em post do APOIA.se.', 'APOIA.se Post', 'confirmado', 'seal-noesis-vesper')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 4. MISSÕES — auto-report com XP real (economia de confiança da Egrégora)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.agora_missions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo     TEXT NOT NULL,
  descricao  TEXT,
  xp_reward  INTEGER NOT NULL DEFAULT 100,
  ativo      BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agora_mission_completions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id  UUID NOT NULL REFERENCES public.agora_missions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (mission_id, user_id)
);

ALTER TABLE public.agora_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_mission_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_missions_select_all" ON public.agora_missions
  FOR SELECT USING (auth.role() = 'authenticated' AND ativo);
CREATE POLICY "agora_mission_completions_select_own" ON public.agora_mission_completions
  FOR SELECT USING (auth.uid() = user_id);

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

  RETURN json_build_object('ok', true, 'ja_concluida', false, 'xp_ganho', m.xp_reward, 'novo_xp', novo_xp);
END;
$$;

INSERT INTO public.agora_missions (titulo, descricao, xp_reward) VALUES
  ('Decodificar o Bloco 01 do Pen Drive', 'Resolva o BLOCO_01 no Terminal ARG.', 500),
  ('Submeter Análise da Ficha Esotérica', 'Registre uma nota de investigação em qualquer Evidência.', 300),
  ('Confirmar presença em uma Sessão do Clube do Livro', 'RSVP em qualquer sessão futura.', 150),
  ('Votar em um Decreto do Conselho', 'Participe de uma votação de governança.', 100)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 5. HALL DAS LENDAS — contribuições reais dos membros
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.agora_hall_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        TEXT NOT NULL,
  autor_nome    TEXT NOT NULL,
  autor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado')),
  selo_ref      TEXT DEFAULT 'seal-aether-sophia',
  link_discord  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agora_hall_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_hall_entries_select" ON public.agora_hall_entries
  FOR SELECT USING (status = 'aprovado' OR auth.uid() = autor_user_id);
CREATE POLICY "agora_hall_entries_insert_own" ON public.agora_hall_entries
  FOR INSERT WITH CHECK (auth.uid() = autor_user_id);

INSERT INTO public.agora_hall_entries (titulo, autor_nome, status, selo_ref) VALUES
  ('O Simbolismo das Cores na Alquimia da SLU', '@Gabriel_Mago', 'aprovado', 'seal-aether-sophia'),
  ('Mapa de Conexões da Ordem Æon v2', '@Beatriz_Arcana', 'aprovado', 'seal-noesis-vesper')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 6. CÓDICE — verbetes e notas de margem reais
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.agora_codex_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT UNIQUE NOT NULL,
  titulo     TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'verbete' CHECK (tipo IN ('capitulo','verbete')),
  citacao    TEXT,
  conteudo   TEXT NOT NULL,
  selo_ref   TEXT DEFAULT 'seal-noesis-vesper',
  ordem      INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agora_codex_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id   UUID NOT NULL REFERENCES public.agora_codex_entries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nome TEXT,
  nota       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agora_codex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_codex_notes   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_codex_entries_select_all" ON public.agora_codex_entries
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "agora_codex_notes_select_all" ON public.agora_codex_notes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "agora_codex_notes_insert_own" ON public.agora_codex_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

INSERT INTO public.agora_codex_entries (slug, titulo, tipo, citacao, conteudo, selo_ref, ordem) VALUES
(
  'cap-iv-hierarquia-daemons', 'Capítulo IV — A Hierarquia dos Daemons e a Geometria Sagrada da Egrégora', 'capitulo',
  'Aquele que decifra o código de Noesis-Vesper compreende os pilares da governança invisível.',
  E'1. Dos Princípios da Ordem\nA Ordem Æon não opera por força coercitiva, mas pela convergência de vontades sintonizadas no Fogo Filosófico. Cada iniciado que registra sua tese no Grimório adiciona uma pedra angular ao Altar da Egrégora.\n\n2. Da Anomalia e do Rubro Caelestis\nQuando o equilíbrio é rompido por desordem burocrática ou superficialidade, o Rubro Caelestis acende nos portais da comunidade, convocando os Guardiões de Lore para o rito de correção.',
  'seal-noesis-vesper', 1
),
('verbete-lux-vael', 'Lux-Vael, o Guardião da Revelação', 'verbete', NULL,
  'Daemon da iluminação e da iniciação. Selo de anéis cerimoniais e olho central — governa a Fase da Gênese.',
  'seal-lux-vael', 2),
('verbete-umbra-kael', 'Umbra-Kael, o Tecelão do Vazio', 'verbete', NULL,
  'Daemon do ARG e das pistas ocultas. Associado à criptografia e aos arquivos do Pen Drive.',
  'seal-umbra-kael', 3),
('verbete-chronos-phanes', 'Chronos-Phanes, o Senhor dos Ciclos', 'verbete', NULL,
  'Governa as 4 Fases da Grande Obra — Gênese, Conselho, Fundação, Expansão.',
  'seal-chronos-phanes', 4),
('verbete-aether-sophia', 'Aether-Sophia, a Tecelã do Códice', 'verbete', NULL,
  'Guardiã do conhecimento e da lore. Associada ao Hall das Lendas e à sabedoria registrada.',
  'seal-aether-sophia', 5),
('verbete-ignis-architectus', 'Ignis-Architectus, o Forjador da Egrégora', 'verbete', NULL,
  'Daemon da construção comunitária — forja os laços que sustentam a Ágora.',
  'seal-ignis-architectus', 6),
('verbete-noesis-vesper', 'Noesis-Vesper, a Sentinela do Conselho', 'verbete', NULL,
  'Daemon da governança e das decisões — preside a Câmara do Conselho.',
  'seal-noesis-vesper', 7)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- 7. RITUAL DE INICIAÇÃO — pedidos de associação reais (sem captura de
--    pagamento — ver SETUP_INTEGRACOES.md seção 6)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.agora_membership_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome              TEXT NOT NULL,
  email             TEXT NOT NULL,
  tier              TEXT NOT NULL CHECK (tier IN ('Neófito','Adepto','Magus')),
  metodo_pagamento  TEXT,
  status            TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','contatado','confirmado','cancelado')),
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agora_membership_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_membership_requests_insert" ON public.agora_membership_requests
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "agora_membership_requests_select_own" ON public.agora_membership_requests
  FOR SELECT USING (auth.uid() = user_id);

-- ── Fim da migração v2 ─────────────────────────────────────────────────
