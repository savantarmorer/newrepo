-- =====================================================================
-- ÁGORA (SLU) — Migração Supabase
-- Projeto Supabase compartilhado com o AMOQ (mesmo SUPABASE_URL).
-- Todas as tabelas usam o prefixo agora_ para não colidir com as
-- tabelas existentes do AMOQ (profiles, document_views, bookmarks).
-- Execute no SQL Editor do Supabase Dashboard (Settings → SQL Editor).
-- =====================================================================

-- ── 1. Perfis da Ágora (estende auth.users) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.agora_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp              INTEGER NOT NULL DEFAULT 0,
  grau            INTEGER NOT NULL DEFAULT 0,   -- ver mapeamento de graus abaixo
  streak_atual    INTEGER NOT NULL DEFAULT 0,
  streak_recorde  INTEGER NOT NULL DEFAULT 0,
  ultimo_login    DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Graus (Manifesto do Avatar — Seção 3):
-- 0 = Neófito, 1 = Adepto, 2 = Mestre da Obra, 3 = Conselheiro
-- XP: 0 / 100 / 500 / 2000

-- ── 2. Sincronização com o Discord (escrita restrita ao service role) ─
CREATE TABLE IF NOT EXISTS public.agora_discord_sync (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id       TEXT NOT NULL,
  discord_username TEXT,
  discord_avatar   TEXT,
  roles            JSONB NOT NULL DEFAULT '[]',
  nickname         TEXT,
  joined_guild_at  TIMESTAMPTZ,
  synced_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

-- ── 3. Clube do Livro ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agora_book_club_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livro_titulo   TEXT NOT NULL,
  livro_autor    TEXT,
  capa_url       TEXT,
  sinopse        TEXT,
  titulo_sessao  TEXT NOT NULL,
  data_sessao    TIMESTAMPTZ NOT NULL,
  canal_discord  TEXT DEFAULT '#clube-do-livro',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agora_book_club_rsvps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.agora_book_club_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_id, user_id)
);

-- ── 4. Eventos da Egrégora ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agora_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       TEXT NOT NULL,
  descricao    TEXT,
  fase         TEXT,          -- Gênese | Conselho | Fundação | Expansão
  tipo         TEXT,          -- live | ritual | workshop | solstício
  data_evento  TIMESTAMPTZ NOT NULL,
  local        TEXT DEFAULT 'Discord da Ágora',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agora_event_rsvps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES public.agora_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- ── 5. Calendário de Chamadas ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agora_calls (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo         TEXT NOT NULL,
  descricao      TEXT,
  data_chamada   TIMESTAMPTZ NOT NULL,
  duracao_min    INTEGER DEFAULT 60,
  link_chamada   TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agora_call_rsvps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id    UUID NOT NULL REFERENCES public.agora_calls(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (call_id, user_id)
);

-- ── Row Level Security ────────────────────────────────────────────────
ALTER TABLE public.agora_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_discord_sync      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_book_club_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_book_club_rsvps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_event_rsvps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_calls             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_call_rsvps        ENABLE ROW LEVEL SECURITY;

-- Perfis: cada iniciado lê e atualiza apenas o próprio
CREATE POLICY "agora_profiles_select_own" ON public.agora_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "agora_profiles_insert_own" ON public.agora_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "agora_profiles_update_own" ON public.agora_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Discord sync: leitura apenas do próprio registro. Escrita somente via
-- service role (o server.js usa a service key, que ignora RLS).
CREATE POLICY "agora_discord_sync_select_own" ON public.agora_discord_sync
  FOR SELECT USING (auth.uid() = user_id);

-- Clube do livro, eventos e chamadas: leitura pública para autenticados
CREATE POLICY "agora_book_sessions_select_all" ON public.agora_book_club_sessions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "agora_events_select_all" ON public.agora_events
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "agora_calls_select_all" ON public.agora_calls
  FOR SELECT USING (auth.role() = 'authenticated');

-- RSVPs: cada iniciado gerencia apenas a própria presença
CREATE POLICY "agora_book_rsvps_select_own" ON public.agora_book_club_rsvps
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agora_book_rsvps_insert_own" ON public.agora_book_club_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agora_book_rsvps_delete_own" ON public.agora_book_club_rsvps
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "agora_event_rsvps_select_own" ON public.agora_event_rsvps
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agora_event_rsvps_insert_own" ON public.agora_event_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agora_event_rsvps_delete_own" ON public.agora_event_rsvps
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "agora_call_rsvps_select_own" ON public.agora_call_rsvps
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agora_call_rsvps_insert_own" ON public.agora_call_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agora_call_rsvps_delete_own" ON public.agora_call_rsvps
  FOR DELETE USING (auth.uid() = user_id);

-- Nota: para o RSVP mostrar contagem agregada (quantos vão) sem expor
-- quem é cada um, crie views públicas de contagem — ver comentário no
-- final do arquivo.

-- ── Trigger: cria perfil automaticamente ao registrar ──────────────────
-- Extrai discord_id do metadata quando o login for via provedor Discord.
CREATE OR REPLACE FUNCTION public.handle_new_agora_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agora_profiles (id, xp, grau, streak_atual, streak_recorde, ultimo_login)
  VALUES (NEW.id, 0, 0, 1, 1, CURRENT_DATE)
  ON CONFLICT (id) DO NOTHING;

  -- Se o cadastro veio do provedor Discord, guarda o discord_id imediatamente
  IF NEW.raw_app_meta_data->>'provider' = 'discord'
     AND NEW.raw_user_meta_data->>'provider_id' IS NOT NULL THEN
    INSERT INTO public.agora_discord_sync (user_id, discord_id, discord_username, discord_avatar)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'provider_id',
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_agora ON auth.users;
CREATE TRIGGER on_auth_user_created_agora
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_agora_user();

-- ── Função utilitária: atualiza streak de login diário ─────────────────
-- Chamada pelo cliente (RPC) uma vez por sessão iniciada.
CREATE OR REPLACE FUNCTION public.registrar_login_agora(uid UUID)
RETURNS public.agora_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.agora_profiles;
BEGIN
  SELECT * INTO p FROM public.agora_profiles WHERE id = uid;

  IF p.ultimo_login = CURRENT_DATE THEN
    RETURN p; -- já contabilizado hoje
  ELSIF p.ultimo_login = CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE public.agora_profiles
      SET streak_atual = streak_atual + 1,
          streak_recorde = GREATEST(streak_recorde, streak_atual + 1),
          ultimo_login = CURRENT_DATE
      WHERE id = uid RETURNING * INTO p;
  ELSE
    UPDATE public.agora_profiles
      SET streak_atual = 1,
          streak_recorde = GREATEST(streak_recorde, 1),
          ultimo_login = CURRENT_DATE
      WHERE id = uid RETURNING * INTO p;
  END IF;

  RETURN p;
END;
$$;

-- ── Seed de exemplo (opcional — remova se não quiser dados de demonstração) ─
INSERT INTO public.agora_book_club_sessions (livro_titulo, livro_autor, titulo_sessao, data_sessao, sinopse)
VALUES (
  'O Templo de Salomão e a Geometria Oculta', 'Autoria Coletiva SLU',
  'Sessão I — Fundamentos da Arquitetura Sagrada',
  (CURRENT_DATE + INTERVAL '7 days' + TIME '20:00')::timestamptz,
  'Primeira leitura coletiva do trimestre: como a geometria sagrada estrutura o worldbuilding da Grande Obra.'
) ON CONFLICT DO NOTHING;

INSERT INTO public.agora_events (titulo, descricao, fase, tipo, data_evento)
VALUES (
  'Rito de Abertura da Fase II — Conselho', 'Cerimônia de abertura com votação em tempo real do tema central.',
  'Conselho', 'ritual', (CURRENT_DATE + INTERVAL '3 days' + TIME '19:30')::timestamptz
) ON CONFLICT DO NOTHING;

INSERT INTO public.agora_calls (titulo, descricao, data_chamada, duracao_min, link_chamada)
VALUES (
  'Mutirão de Decifração — Bloco 01 do Pen Drive', 'Chamada coletiva por voz para decifrar o manifest_1998.enc.',
  (CURRENT_DATE + INTERVAL '2 days' + TIME '21:00')::timestamptz, 90, 'https://discord.gg/agora-slu'
) ON CONFLICT DO NOTHING;

-- ── Verificar criação ────────────────────────────────────────────────
-- SELECT * FROM public.agora_profiles LIMIT 5;
-- SELECT * FROM public.agora_book_club_sessions;
-- SELECT * FROM public.agora_events;
-- SELECT * FROM public.agora_calls;
