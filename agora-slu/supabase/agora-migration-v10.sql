-- =====================================================================
-- ÁGORA (SLU) — Migração v10
-- Feed Global de Atividade — cobre agora também LOGIN (quem entrou, por
-- qual provedor, horário) e VOTOS em decretos, além do que já existia
-- (missões, tarefas, RSVPs, notas, fichas Pró-Vida). Adiciona paginação
-- e filtro por tipo à RPC de leitura do feed.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v9.
-- =====================================================================

-- ── Login: uma linha por entrada real (não por page view) ──────────────
-- fonte_id é sempre um UUID novo (gen_random_uuid()) — de propósito, pra
-- NÃO cair na constraint única de agora_xp_ledger_fonte_unica e permitir
-- registrar todo login, não só o primeiro. xp=0: login não paga XP, só
-- aparece no feed. O gate de "é login de verdade, não só um reload de
-- página com sessão já existente" é feito no cliente (agoraAuth.js só
-- chama isto no evento SIGNED_IN do Supabase, nunca no INITIAL_SESSION).
CREATE OR REPLACE FUNCTION public.registrar_atividade_login(uid UUID, p_provider TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  nome TEXT;
  rotulo TEXT;
BEGIN
  IF uid IS DISTINCT FROM auth.uid() THEN
    RETURN; -- só registra login da própria sessão que está chamando
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

-- ── Governança: voto também aparece no feed (sem revelar em quê votou
--    além do que já é público na apuração agregada) ────────────────────
CREATE OR REPLACE FUNCTION public.votar_decreto(uid UUID, p_decree_id UUID, p_escolha TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d RECORD;
  ja_votou BOOLEAN;
BEGIN
  IF p_escolha NOT IN ('sim','nao','abster') THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Escolha inválida.');
  END IF;

  SELECT * INTO d FROM agora_decrees WHERE id = p_decree_id;
  IF NOT FOUND OR d.status <> 'aberto' OR now() > d.fecha_em THEN
    RETURN json_build_object('ok', false, 'mensagem', 'Este decreto não está mais aberto à votação.');
  END IF;

  SELECT EXISTS(SELECT 1 FROM agora_decree_votes WHERE decree_id = p_decree_id AND user_id = uid) INTO ja_votou;

  INSERT INTO agora_decree_votes (decree_id, user_id, escolha)
  VALUES (p_decree_id, uid, p_escolha)
  ON CONFLICT (decree_id, user_id) DO UPDATE SET escolha = EXCLUDED.escolha, created_at = now();

  IF NOT ja_votou THEN
    INSERT INTO agora_xp_ledger (user_id, xp, motivo, fonte_tipo, fonte_id)
    VALUES (uid, 0, 'Votou no Decreto Nº ' || d.numero || ' — "' || d.titulo || '"', 'voto_decreto', p_decree_id::text)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN json_build_object('ok', true, 'mensagem', 'Voto registrado no Livro do Conselho.');
END;
$$;

-- ── Feed: paginação por cursor (p_antes_de) + filtro por tipo ──────────
CREATE OR REPLACE FUNCTION public.obter_atividade_recente(
  p_limite INTEGER DEFAULT 20, p_antes_de TIMESTAMPTZ DEFAULT NULL, p_fonte_tipo TEXT DEFAULT NULL
)
RETURNS TABLE (autor_nome TEXT, xp INTEGER, motivo TEXT, fonte_tipo TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT autor_nome, xp, motivo, fonte_tipo, created_at
  FROM agora_xp_ledger
  WHERE (p_antes_de IS NULL OR created_at < p_antes_de)
    AND (p_fonte_tipo IS NULL OR fonte_tipo = p_fonte_tipo)
  ORDER BY created_at DESC
  LIMIT LEAST(GREATEST(p_limite, 1), 100);
$$;

-- ── Fim da migração v10 ────────────────────────────────────────────────
