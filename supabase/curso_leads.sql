-- Contatos da pré-venda do curso (formulário de /jornalismo/).
-- O site só consegue INSERIR. Para ver os dados: Supabase → Table Editor → curso_leads.
create table if not exists public.curso_leads (
  id         bigint generated always as identity primary key,
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and char_length(email) <= 200),
  telefone   text not null check (telefone ~ '^[0-9]{10,13}$'),
  aceite     boolean not null default false check (aceite),
  origem     text check (char_length(origem) <= 300),
  criado_em  timestamptz not null default now()
);

alter table public.curso_leads enable row level security;

-- Visitantes do site podem apenas gravar um contato (não leem, não alteram, não apagam).
drop policy if exists "curso_leads_insert_publico" on public.curso_leads;
create policy "curso_leads_insert_publico" on public.curso_leads
  for insert to anon, authenticated
  with check (aceite);

grant insert on public.curso_leads to anon, authenticated;
