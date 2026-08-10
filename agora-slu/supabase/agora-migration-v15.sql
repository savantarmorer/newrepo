-- =====================================================================
-- ÁGORA (SLU) — Migração v15
-- Limpeza: remove as tabelas e RPCs órfãs do Terminal ARG e do Clube do
-- Livro. As páginas terminal.html e clube-do-livro.html já foram
-- removidas do site em sessões anteriores — nada no cliente chama mais
-- essas tabelas/funções. Confirmado destrutivo, executar com atenção.
--
-- Execute DEPOIS de agora-migration.sql + v2 até v14.
-- =====================================================================

DROP FUNCTION IF EXISTS public.resolver_puzzle_arg(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.obter_progresso_arg();

DROP TABLE IF EXISTS public.agora_arg_solves CASCADE;
DROP TABLE IF EXISTS public.agora_arg_answers CASCADE;
DROP TABLE IF EXISTS public.agora_arg_puzzles CASCADE;

DROP TABLE IF EXISTS public.agora_book_club_rsvps CASCADE;
DROP TABLE IF EXISTS public.agora_book_club_sessions CASCADE;

-- ── Fim da migração v15 ─────────────────────────────────────────────────
