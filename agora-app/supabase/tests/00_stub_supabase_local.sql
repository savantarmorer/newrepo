-- ============================================================================
-- STUB do ambiente Supabase para validar migrations/seed/testes num Postgres
-- "puro" (CI ou máquina sem a CLI do Supabase). NÃO rode isto num projeto
-- Supabase real: lá os esquemas auth/storage e os papéis já existem.
--
-- Uso:
--   createdb agora_teste
--   psql agora_teste -f supabase/tests/00_stub_supabase_local.sql
--   for f in supabase/migrations/*.sql; do psql agora_teste -v ON_ERROR_STOP=1 -f $f; done
--   psql agora_teste -v ON_ERROR_STOP=1 -f supabase/seed.sql
--   psql agora_teste -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- ============================================================================
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;

create schema if not exists auth;
create schema if not exists storage;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
grant usage on schema auth, storage, extensions, public to anon, authenticated, service_role;

create table if not exists auth.users (
  id uuid primary key,
  email text unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb default '{}'::jsonb,
  raw_app_meta_data jsonb default '{}'::jsonb,
  aud text, role text, instance_id uuid,
  confirmation_token text default '', recovery_token text default '',
  email_change_token_new text default '', email_change text default '',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists auth.identities (
  id uuid primary key, user_id uuid references auth.users(id), provider_id text, provider text,
  identity_data jsonb, last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz
);

-- mesmas definições do Supabase (aceitam o GUC legado e o JSON do PostgREST v10+)
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))::text
$$;

create table if not exists storage.buckets (
  id text primary key, name text, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[], created_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text, owner uuid, metadata jsonb, created_at timestamptz default now()
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select string_to_array(name, '/')
$$;
grant select, insert, update, delete on storage.objects to authenticated;

-- Utilitário dos testes: assume a identidade de um usuário (como faria o PostgREST)
create or replace function public.teste_como(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  perform set_config('request.jwt.claim.role', case when p_uid is null then 'anon' else 'authenticated' end, true);
  if p_uid is null then execute 'set local role anon'; else execute 'set local role authenticated'; end if;
end $$;
grant execute on function public.teste_como(uuid) to anon, authenticated, service_role;
