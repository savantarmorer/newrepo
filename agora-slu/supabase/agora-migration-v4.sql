-- =====================================================================
-- ÁGORA (SLU) — Migração v4
-- Quadro de Tarefas dos Voluntários (espelha o #quadro-de-tarefas real
-- do Discord — "Projeto Agora [Voluntários]").
-- Execute DEPOIS de agora-migration.sql, v2.sql e v3.sql.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.agora_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       TEXT NOT NULL,
  descricao    TEXT,
  categoria    TEXT NOT NULL DEFAULT 'Geral', -- Arte, Redação, Dev, Moderação, Lore...
  xp_reward    INTEGER NOT NULL DEFAULT 200,
  status       TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','em_andamento','concluida')),
  claimed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at   TIMESTAMPTZ,
  concluded_at TIMESTAMPTZ,
  link_discord TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agora_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_tasks_select_all" ON public.agora_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Sem policy de INSERT/UPDATE direta: reivindicar/concluir passam pelas
-- RPCs abaixo (SECURITY DEFINER), que garantem atomicidade (evita dois
-- iniciados reivindicarem a mesma tarefa ao mesmo tempo).

CREATE OR REPLACE FUNCTION public.reivindicar_tarefa(uid UUID, p_task_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t RECORD;
BEGIN
  SELECT * INTO t FROM agora_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'mensagem', 'Tarefa inexistente.'); END IF;
  IF t.status <> 'aberta' THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Esta tarefa já foi reivindicada por outro iniciado.');
  END IF;

  UPDATE agora_tasks SET status = 'em_andamento', claimed_by = uid, claimed_at = now() WHERE id = p_task_id;
  RETURN json_build_object('ok', true, 'mensagem', 'Tarefa reivindicada. Boa sorte, Iniciado.');
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

  RETURN json_build_object('ok', true, 'mensagem', 'Tarefa concluída. XP creditado.', 'xp_ganho', t.xp_reward, 'novo_xp', novo_xp);
END;
$$;

-- Libera uma tarefa que o próprio reivindicante não vai mais fazer
CREATE OR REPLACE FUNCTION public.liberar_tarefa(uid UUID, p_task_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t RECORD;
BEGIN
  SELECT * INTO t FROM agora_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND OR t.claimed_by IS DISTINCT FROM uid OR t.status <> 'em_andamento' THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Você não pode liberar esta tarefa.');
  END IF;
  UPDATE agora_tasks SET status = 'aberta', claimed_by = NULL, claimed_at = NULL WHERE id = p_task_id;
  RETURN json_build_object('ok', true, 'mensagem', 'Tarefa liberada para a Egrégora.');
END;
$$;

-- Seeds espelhando o quadro real do Discord (#quadro-de-tarefas)
INSERT INTO public.agora_tasks (titulo, descricao, categoria, xp_reward) VALUES
  ('001. Arte — Criação de logo e banner', 'Produzir logo e banner oficiais seguindo o Design System Cultus (Roxo Oculto + Dourado Alquímico).', 'Arte', 300),
  ('Redação — Verbete do Grimório Ágora', 'Escrever um novo verbete para o Codex Caelestis a partir de uma discussão do #grimorium-ágora.', 'Redação', 200),
  ('Moderação — Curadoria do Hall das Lendas', 'Revisar contribuições pendentes em agora_hall_entries e aprovar as que atendem ao rigor da Egrégora.', 'Moderação', 150)
ON CONFLICT DO NOTHING;

-- ── Verificar ────────────────────────────────────────────────────────
-- SELECT * FROM public.agora_tasks ORDER BY status, created_at;
