-- Correção: quem cria um artigo precisa enxergá-lo logo no INSERT ... RETURNING.
-- A autoria (artigo_autores) é gravada por gatilho AFTER INSERT, que roda depois do
-- RETURNING; sem esta regra o rascunho recém-criado ficava invisível e o app/bot
-- recebiam "new row violates row-level security policy".
drop policy if exists "artigos: leitura por status e papel" on public.artigos;
create policy "artigos: leitura por status e papel" on public.artigos
  for select to authenticated using (
    public.eh_admin()
    or criado_por = auth.uid()
    or public.eh_autor_artigo(id)
    or (public.pode_ler() and status = 'publicado' and excluido_em is null)
    or (status = 'em_revisao' and public.tem_nivel(3))
  );
