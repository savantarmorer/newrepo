#!/usr/bin/env bash
# Valida migrations + seed + testes de RLS num Postgres 15/16 "puro" (sem a CLI do Supabase).
# Uso: DATABASE_URL=postgres://postgres@localhost:5432/postgres ./scripts/testar-banco.sh
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="${DATABASE_URL:-postgres://postgres@localhost:5432/postgres}"
DB=agora_teste_$$
psql "$BASE" -q -c "create database $DB"
trap 'psql "$BASE" -q -c "drop database if exists $DB" >/dev/null' EXIT
URL="${BASE%/*}/$DB"
run() { psql "$URL" -q -X -v ON_ERROR_STOP=1 -f "$1"; }
run supabase/tests/00_stub_supabase_local.sql
for f in supabase/migrations/*.sql; do echo "→ $f"; run "$f"; done
echo "→ seed"; run supabase/seed.sql
echo "→ testes de RLS e regras"; run supabase/tests/rls_test.sql 2>&1 | grep -E "ok —|FALHA|✔"
