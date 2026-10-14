-- Acervo: catálogo dos documentos da biblioteca do site (pastas públicas do Google Drive).
-- Os arquivos continuam no Drive; aqui fica só o índice (nome, tipo, pasta, assunto) para
-- o app e o bot buscarem. Quem preenche é scripts/sincronizar-acervo.mjs (service_role).

-- array_to_string é só "stable" para o Postgres; com text[] o resultado não muda,
-- então este invólucro pode ser usado na coluna gerada de busca.
create or replace function public.juntar_textos(p text[]) returns text
language sql immutable parallel safe as $$ select array_to_string(p, ' ') $$;

create table public.acervo_documentos (
  id text primary key,                      -- id do arquivo no Google Drive
  nome text not null,                       -- nome original do arquivo
  titulo text not null,                     -- nome limpo (sem extensão, "_" → espaço)
  tipo text not null check (tipo in ('pdf', 'documento', 'apresentacao', 'planilha', 'livro', 'imagem', 'audio', 'video', 'outro')),
  mime text not null,
  categoria text not null,                  -- pasta raiz (ex.: Sociedades Secretas)
  colecao text,                             -- subpasta de primeiro nível, com o nome limpo
  caminho text[] not null default '{}',     -- pastas até o arquivo, a partir da categoria
  assunto text,                             -- assunto detectado por palavras-chave (ex.: Maçonaria)
  tamanho bigint,
  modificado_em timestamptz,
  visto_em timestamptz not null default now(), -- última sincronização em que o arquivo apareceu
  created_at timestamptz not null default now(),
  busca tsvector generated always as (
    public.doc_busca(titulo, coalesce(colecao, '') || ' ' || coalesce(assunto, ''), public.juntar_textos(caminho))
  ) stored,
  chave text generated always as (lower(public.f_unaccent(titulo))) stored
);

comment on table public.acervo_documentos is 'Índice dos documentos da biblioteca do site (Google Drive), sincronizado por script';

create index acervo_busca_idx on public.acervo_documentos using gin (busca);
create index acervo_chave_trgm_idx on public.acervo_documentos using gin (chave extensions.gin_trgm_ops);
create index acervo_categoria_idx on public.acervo_documentos (categoria, colecao, titulo);
create index acervo_assunto_idx on public.acervo_documentos (assunto, titulo);

alter table public.acervo_documentos enable row level security;
create policy "acervo: membros leem" on public.acervo_documentos for select to authenticated using ((select public.pode_ler())); -- avaliada uma vez por consulta
revoke all on public.acervo_documentos from anon;
revoke insert, update, delete, truncate on public.acervo_documentos from authenticated;
grant select on public.acervo_documentos to authenticated;
grant all on public.acervo_documentos to service_role;

-- Busca no acervo (SECURITY INVOKER: a política acima continua valendo).
-- Sem termo, lista em ordem alfabética dentro dos filtros.
create or replace function public.buscar_acervo(
  p_termo text default null,
  p_categoria text default null,
  p_colecao text default null,
  p_assunto text default null,
  p_tipo text default null,
  p_limite integer default 30,
  p_deslocamento integer default 0
) returns table (
  id text, titulo text, tipo text, categoria text, colecao text, assunto text, caminho text[], tamanho bigint, modificado_em timestamptz
)
language sql stable as $$
  with q as (
    select nullif(trim(p_termo), '') as termo,
           case when nullif(trim(p_termo), '') is null then null
                else websearch_to_tsquery('portuguese', public.f_unaccent(p_termo)) end as tsq,
           '%' || lower(public.f_unaccent(coalesce(trim(p_termo), ''))) || '%' as padrao
  )
  select d.id, d.titulo, d.tipo, d.categoria, d.colecao, d.assunto, d.caminho, d.tamanho, d.modificado_em
  from public.acervo_documentos d, q
  where (q.termo is null or d.busca @@ q.tsq or d.chave like q.padrao)
    and (p_categoria is null or d.categoria = p_categoria)
    and (p_colecao is null or d.colecao = p_colecao)
    and (p_assunto is null or d.assunto = p_assunto)
    and (p_tipo is null or d.tipo = p_tipo)
  order by case when q.termo is null then 0 else ts_rank(d.busca, q.tsq) + (d.chave like q.padrao)::int end desc,
           d.titulo
  limit least(greatest(coalesce(p_limite, 30), 1), 100)
  offset greatest(coalesce(p_deslocamento, 0), 0)
$$;

-- Resumo para montar os menus: quantos documentos por categoria/coleção e por assunto.
create or replace function public.acervo_resumo()
returns table (grupo text, categoria text, nome text, total bigint)
language sql stable as $$
  select 'colecao', categoria, coalesce(colecao, '(raiz)'), count(*) from public.acervo_documentos group by categoria, colecao
  union all
  select 'assunto', null, assunto, count(*) from public.acervo_documentos where assunto is not null group by assunto
  order by 1, 2, 4 desc
$$;

revoke execute on function public.buscar_acervo(text, text, text, text, text, integer, integer) from public, anon;
revoke execute on function public.acervo_resumo() from public, anon;
grant execute on function public.buscar_acervo(text, text, text, text, text, integer, integer) to authenticated, service_role;
grant execute on function public.acervo_resumo() to authenticated, service_role;
