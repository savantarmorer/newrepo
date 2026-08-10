-- =====================================================================
-- ÁGORA (SLU) — Migração v11
-- Corrige o feed de atividade repetindo "Entrou na Ágora via e-mail"
-- dezenas de vezes. Causa: em um site estático multi-página, cada
-- navegação recarrega a página inteira, recriando o cliente Supabase —
-- e o SDK dispara SIGNED_IN não só num login de verdade, mas também ao
-- restaurar a sessão já existente do localStorage a cada page view.
-- registrar_atividade_login() gerava um fonte_id aleatório de propósito
-- pra nunca bater na constraint única, contando 100% com o cliente pra
-- filtrar isso — o que na prática não está acontecendo.
--
-- Fix: dedup por janela de tempo dentro da própria função (robusto,
-- independe de qual evento o SDK dispara no cliente). Só registra um
-- novo "login" no feed se o último já registrado para este usuário foi
-- há mais de 30 minutos.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v10.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.registrar_atividade_login(uid UUID, p_provider TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  nome TEXT;
  rotulo TEXT;
  ultimo_login TIMESTAMPTZ;
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN
    RETURN; -- só registra login da própria sessão que está chamando
  END IF;

  SELECT created_at INTO ultimo_login FROM agora_xp_ledger
    WHERE user_id = uid AND fonte_tipo = 'login'
    ORDER BY created_at DESC LIMIT 1;

  IF ultimo_login IS NOT NULL AND now() - ultimo_login < interval '30 minutes' THEN
    RETURN; -- já tem um login recente no feed — provável reload/navegação, não login novo
  END IF;

  SELECT COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
    INTO nome FROM auth.users WHERE id = uid;

  rotulo := CASE p_provider
    WHEN 'discord' THEN 'Discord'
    WHEN 'google' THEN 'Google'
    ELSE 'e-mail'
  END;

  INSERT INTO agora_xp_ledger (user_id, autor_nome, xp, motivo, fonte_tipo, fonte_id)
  VALUES (uid, nome, 0, 'Entrou na Ágora via ' || rotulo, 'login', gen_random_uuid()::text);
END;
$$;

-- ── Limpeza única dos registros duplicados já existentes ───────────────
-- Colapsa cada rajada de logins do mesmo usuário (todos a menos de 30min
-- do primeiro da rajada) numa única linha — a mais antiga da rajada.
DELETE FROM agora_xp_ledger a
USING agora_xp_ledger b
WHERE a.fonte_tipo = 'login'
  AND b.fonte_tipo = 'login'
  AND a.user_id = b.user_id
  AND a.id <> b.id
  AND a.created_at > b.created_at
  AND a.created_at - b.created_at < interval '30 minutes';

-- ── Fim da migração v11 ─────────────────────────────────────────────────
