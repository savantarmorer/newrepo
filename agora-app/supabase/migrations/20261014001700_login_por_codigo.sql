-- Entrar no app com a conta criada pelo Discord, sem e-mail nem senha:
-- o bot gera um código de uso único (/agora app), a pessoa digita no app e a Edge Function
-- entrar-com-codigo troca o código por uma sessão dessa conta.
create table public.codigos_login (
  codigo_hash text primary key,                 -- sha256 do código (o código em si não fica salvo)
  profile_id uuid not null references public.profiles (id) on delete cascade,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  usado_em timestamptz
);
create index codigos_login_profile_idx on public.codigos_login (profile_id);
comment on table public.codigos_login is 'Códigos de uso único gerados pelo bot do Discord para entrar no app';

alter table public.codigos_login enable row level security;
revoke all on public.codigos_login from anon, authenticated;
grant all on public.codigos_login to service_role;

-- Consome o código (uma vez só, dentro da validade) e devolve a conta. Só o servidor chama.
create or replace function public.usar_codigo_login(p_hash text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_profile uuid;
begin
  update public.codigos_login c set usado_em = now()
   where c.codigo_hash = p_hash and c.usado_em is null and c.expira_em > now()
     and exists (select 1 from public.profiles p where p.id = c.profile_id and p.excluido_em is null)
  returning c.profile_id into v_profile;
  -- limpeza: códigos vencidos há mais de um dia
  delete from public.codigos_login where expira_em < now() - interval '1 day';
  return v_profile;
end $$;
revoke execute on function public.usar_codigo_login(text) from public, anon, authenticated;
grant execute on function public.usar_codigo_login(text) to service_role;
