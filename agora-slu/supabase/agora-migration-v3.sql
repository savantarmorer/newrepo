-- =====================================================================
-- ÁGORA (SLU) — Migração v3
-- Eventos sincronizados automaticamente do Discord (Scheduled Events).
-- Execute DEPOIS de agora-migration.sql e agora-migration-v2.sql.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.agora_discord_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_event_id  TEXT UNIQUE NOT NULL,
  titulo            TEXT NOT NULL,
  descricao         TEXT,
  data_inicio       TIMESTAMPTZ NOT NULL,
  data_fim          TIMESTAMPTZ,
  local             TEXT DEFAULT 'Discord da Ágora',
  status            TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','ativo','concluido','cancelado')),
  synced_at         TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agora_discord_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_discord_events_select_all" ON public.agora_discord_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Sem policy de INSERT/UPDATE para authenticated/anon: só o server (service
-- role, via /api/discord/sync interno do syncDiscordEvents) escreve aqui.

-- RSVP reaproveita o padrão das outras tabelas de presença
CREATE TABLE IF NOT EXISTS public.agora_discord_event_rsvps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.agora_discord_events(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.agora_discord_event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agora_discord_event_rsvps_select_own" ON public.agora_discord_event_rsvps
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agora_discord_event_rsvps_insert_own" ON public.agora_discord_event_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agora_discord_event_rsvps_delete_own" ON public.agora_discord_event_rsvps
  FOR DELETE USING (auth.uid() = user_id);

-- ── Verificar ────────────────────────────────────────────────────────
-- SELECT * FROM public.agora_discord_events ORDER BY data_inicio;
