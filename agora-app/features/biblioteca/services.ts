import { dados, dadosOuNulo, meuId, rpc, supabase } from '@/lib/supabase';
import { anexarPerfis, paginar, perfisPorIds, TAMANHO_PAGINA, type Pagina } from '../comum';
import type { Artigo, Autoria, DocumentoAcervo, ItemTrilha, Resposta, ResumoAcervo, Revisao, Tema, Topico, Trilha } from './types';

// ------------------------------------------------------------------ temas
export async function listarTemas(): Promise<Tema[]> {
  return dados(supabase.from('temas').select('*').order('ordem'));
}

export async function temaPorSlug(slug: string): Promise<Tema | null> {
  return dadosOuNulo(supabase.from('temas').select('*').eq('slug', slug).maybeSingle());
}

// ------------------------------------------------------------------ tópicos
const COLUNAS_TOPICO = 'id, tema_id, autor_id, titulo, corpo_md, fixado, trancado, status, oculto, editado_em, ultima_atividade_em, created_at';
const CAMPOS_TOPICO = `${COLUNAS_TOPICO}, tema:temas(nome, slug), respostas(count)`;

export async function listarTopicos(opts: { temaId?: string; temaIds?: string[]; cursor?: string | null; limite?: number }): Promise<Pagina<Topico>> {
  let q = supabase.from('topicos').select(CAMPOS_TOPICO).is('excluido_em', null)
    .order('fixado', { ascending: false }).order('ultima_atividade_em', { ascending: false }).limit(opts.limite ?? TAMANHO_PAGINA);
  if (opts.temaId) q = q.eq('tema_id', opts.temaId);
  if (opts.temaIds?.length) q = q.in('tema_id', opts.temaIds);
  if (opts.cursor) q = q.lt('ultima_atividade_em', opts.cursor);
  const lista = await anexarPerfis(await dados<Topico[]>(q), 'autor_id');
  return paginar(lista, 'ultima_atividade_em');
}

export async function buscarTopico(id: string): Promise<Topico | null> {
  const t = await dadosOuNulo<Topico>(supabase.from('topicos').select(CAMPOS_TOPICO).eq('id', id).maybeSingle());
  if (!t) return null;
  const [comAutor] = await anexarPerfis([t], 'autor_id');
  return comAutor ?? null;
}

/** Respostas em árvore de 2 níveis */
export async function listarRespostas(topicoId: string): Promise<Resposta[]> {
  const lista = await anexarPerfis(
    await dados<Resposta[]>(supabase.from('respostas').select('*').eq('topico_id', topicoId).order('created_at')),
    'autor_id',
  );
  const raiz: Resposta[] = [];
  const porId = new Map<string, Resposta>();
  for (const r of lista) porId.set(r.id, { ...r, filhos: [] });
  for (const r of porId.values()) {
    if (r.resposta_pai_id && porId.has(r.resposta_pai_id)) porId.get(r.resposta_pai_id)!.filhos!.push(r);
    else raiz.push(r);
  }
  return raiz;
}

export async function criarTopico(v: { tema_id: string; titulo: string; corpo_md: string }): Promise<Topico> {
  const autor_id = await meuId();
  return dados(supabase.from('topicos').insert({ ...v, autor_id }).select(COLUNAS_TOPICO).single());
}

export async function editarTopico(id: string, v: Partial<Pick<Topico, 'titulo' | 'corpo_md' | 'status' | 'fixado' | 'trancado'>>) {
  return dados(supabase.from('topicos').update(v).eq('id', id).select(COLUNAS_TOPICO).single());
}

export async function responder(v: { topico_id: string; corpo_md: string; resposta_pai_id?: string | null }) {
  const autor_id = await meuId();
  return dados(supabase.from('respostas').insert({ ...v, autor_id }).select('*').single());
}

export async function editarResposta(id: string, corpo_md: string) {
  return dados(supabase.from('respostas').update({ corpo_md }).eq('id', id).select('*').single());
}

export async function excluirResposta(id: string) {
  return dados(supabase.from('respostas').update({ excluido_em: new Date().toISOString() }).eq('id', id));
}

export async function marcarUtil(id: string, util: boolean) {
  return dados(supabase.from('respostas').update({ marcada_como_util: util }).eq('id', id).select('id').single());
}

// ------------------------------------------------------------------ artigos
const COLUNAS_ARTIGO = 'id, tema_id, criado_por, titulo, resumo, corpo_md, capa_url, status, rodada_revisao, topico_origem_id, publicado_em, oculto, created_at, updated_at';
const CAMPOS_ARTIGO = `${COLUNAS_ARTIGO}, tema:temas(nome, slug)`;

export async function listarArtigos(opts: { temaId?: string; cursor?: string | null; limite?: number }): Promise<Pagina<Artigo>> {
  let q = supabase.from('artigos').select(CAMPOS_ARTIGO).eq('status', 'publicado').is('excluido_em', null)
    .order('publicado_em', { ascending: false }).limit(opts.limite ?? TAMANHO_PAGINA);
  if (opts.temaId) q = q.eq('tema_id', opts.temaId);
  if (opts.cursor) q = q.lt('publicado_em', opts.cursor);
  return paginar(await dados<Artigo[]>(q), 'publicado_em');
}

export async function buscarArtigo(id: string): Promise<{ artigo: Artigo; autoria: Autoria[] } | null> {
  const artigo = await dadosOuNulo<Artigo>(supabase.from('artigos').select(CAMPOS_ARTIGO).eq('id', id).maybeSingle());
  if (!artigo) return null;
  const autoriaBruta = await dados<Autoria[]>(supabase.from('artigo_autores').select('profile_id, papel').eq('artigo_id', id));
  const perfis = await perfisPorIds(autoriaBruta.map((a) => a.profile_id));
  return { artigo, autoria: autoriaBruta.map((a) => ({ ...a, perfil: perfis[a.profile_id] })) };
}

export async function meusArtigos(): Promise<(Artigo & { papel: string })[]> {
  const id = await meuId();
  const linhas = await dados<{ papel: string; artigo: Artigo | null }[]>(
    supabase.from('artigo_autores').select('papel, artigo:artigos(id, tema_id, criado_por, titulo, resumo, corpo_md, capa_url, status, rodada_revisao, topico_origem_id, publicado_em, oculto, created_at, updated_at, tema:temas(nome, slug))').eq('profile_id', id).in('papel', ['autor', 'coautor']),
  );
  return linhas.filter((l) => l.artigo).map((l) => ({ ...(l.artigo as Artigo), papel: l.papel }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function salvarArtigo(v: { id?: string; tema_id: string; titulo: string; resumo?: string | null; corpo_md: string; capa_url?: string | null; topico_origem_id?: string | null }) {
  if (v.id) {
    const { id, ...campos } = v;
    return dados<Artigo>(supabase.from('artigos').update(campos).eq('id', id).select(COLUNAS_ARTIGO).single());
  }
  const criado_por = await meuId();
  return dados<Artigo>(supabase.from('artigos').insert({ ...v, criado_por }).select(COLUNAS_ARTIGO).single());
}

export async function mudarStatusArtigo(id: string, status: 'em_revisao' | 'rascunho') {
  return dados(supabase.from('artigos').update({ status }).eq('id', id).select('id, status').single());
}

export async function adicionarCoautor(artigoId: string, profileId: string) {
  return dados(supabase.from('artigo_autores').insert({ artigo_id: artigoId, profile_id: profileId, papel: 'coautor' }));
}

export async function removerCoautor(artigoId: string, profileId: string) {
  return dados(supabase.from('artigo_autores').delete().eq('artigo_id', artigoId).eq('profile_id', profileId).eq('papel', 'coautor'));
}

export async function listarRevisoes(artigoId: string): Promise<Revisao[]> {
  return anexarPerfis(
    await dados<Revisao[]>(supabase.from('revisoes').select('*').eq('artigo_id', artigoId).order('created_at')),
    'revisor_id',
    'revisor',
  ) as Promise<Revisao[]>;
}

/** Fila de revisão: artigos em revisão de que não sou autor (RLS só mostra a curadores) */
export async function filaRevisao(): Promise<(Artigo & { aprovacoes: number; jaRevisei: boolean })[]> {
  const eu = await meuId();
  const artigos = await dados<Artigo[]>(supabase.from('artigos').select(CAMPOS_ARTIGO).eq('status', 'em_revisao').order('updated_at'));
  if (!artigos.length) return [];
  const [autorias, revisoes] = await Promise.all([
    dados<{ artigo_id: string; profile_id: string }[]>(
      supabase.from('artigo_autores').select('artigo_id, profile_id').in('artigo_id', artigos.map((a) => a.id)).in('papel', ['autor', 'coautor']),
    ),
    dados<{ artigo_id: string; revisor_id: string; rodada: number; parecer: string }[]>(
      supabase.from('revisoes').select('artigo_id, revisor_id, rodada, parecer').in('artigo_id', artigos.map((a) => a.id)),
    ),
  ]);
  return artigos
    .filter((a) => !autorias.some((x) => x.artigo_id === a.id && x.profile_id === eu))
    .map((a) => {
      const daRodada = revisoes.filter((r) => r.artigo_id === a.id && r.rodada === a.rodada_revisao);
      return { ...a, aprovacoes: daRodada.filter((r) => r.parecer === 'aprovar').length, jaRevisei: daRodada.some((r) => r.revisor_id === eu) };
    });
}

export async function revisar(v: { artigo_id: string; parecer: Revisao['parecer']; comentario: string }) {
  const revisor_id = await meuId();
  return dados(supabase.from('revisoes').insert({ ...v, revisor_id, rodada: 0 }));
}

// ------------------------------------------------------------------ trilhas
const COLUNAS_TRILHA = 'id, titulo, descricao, tema_id, curador_id, nivel_dificuldade, capa_url, publicada, destaque, publicada_em, created_at';
export async function listarTrilhas(opts: { temaId?: string; destaque?: boolean } = {}): Promise<Trilha[]> {
  let q = supabase.from('trilhas').select(`${COLUNAS_TRILHA}, tema:temas(nome, slug), trilha_itens(count)`).eq('publicada', true).is('excluido_em', null)
    .order('destaque', { ascending: false }).order('publicada_em', { ascending: false });
  if (opts.temaId) q = q.eq('tema_id', opts.temaId);
  if (opts.destaque) q = q.eq('destaque', true);
  return dados(q);
}

export async function buscarTrilha(id: string): Promise<{ trilha: Trilha; itens: ItemTrilha[]; feitos: string[]; concluida: boolean } | null> {
  const trilha = await dadosOuNulo<Trilha>(supabase.from('trilhas').select(`${COLUNAS_TRILHA}, tema:temas(nome, slug)`).eq('id', id).maybeSingle());
  if (!trilha) return null;
  const eu = await meuId();
  const [itens, progresso, concl] = await Promise.all([
    dados<ItemTrilha[]>(supabase.from('trilha_itens').select('artigo_id, ordem, artigo:artigos(id, titulo, resumo, corpo_md)').eq('trilha_id', id).order('ordem')),
    dados<{ artigo_id: string }[]>(supabase.from('progresso_trilha').select('artigo_id').eq('trilha_id', id).eq('profile_id', eu)),
    dadosOuNulo<{ trilha_id: string }>(supabase.from('trilhas_concluidas').select('trilha_id').eq('trilha_id', id).eq('profile_id', eu).maybeSingle()),
  ]);
  return { trilha, itens, feitos: progresso.map((p) => p.artigo_id), concluida: !!concl };
}

/** Trilhas que comecei e ainda não concluí, com progresso */
export async function trilhasEmAndamento(): Promise<{ trilha: Trilha; feitos: number; total: number }[]> {
  const eu = await meuId();
  const [progresso, concluidas] = await Promise.all([
    dados<{ trilha_id: string; artigo_id: string }[]>(supabase.from('progresso_trilha').select('trilha_id, artigo_id').eq('profile_id', eu)),
    dados<{ trilha_id: string }[]>(supabase.from('trilhas_concluidas').select('trilha_id').eq('profile_id', eu)),
  ]);
  const ids = [...new Set(progresso.map((p) => p.trilha_id))].filter((id) => !concluidas.some((c) => c.trilha_id === id));
  if (!ids.length) return [];
  const trilhas = await dados<Trilha[]>(supabase.from('trilhas').select(`${COLUNAS_TRILHA}, tema:temas(nome, slug), trilha_itens(count)`).in('id', ids));
  return trilhas.map((t) => ({
    trilha: t,
    feitos: progresso.filter((p) => p.trilha_id === t.id).length,
    total: t.trilha_itens?.[0]?.count ?? 0,
  }));
}

export async function minhasTrilhasCuradas(): Promise<Trilha[]> {
  const eu = await meuId();
  return dados(supabase.from('trilhas').select(`${COLUNAS_TRILHA}, tema:temas(nome, slug), trilha_itens(count)`).eq('curador_id', eu).is('excluido_em', null).order('created_at', { ascending: false }));
}

export async function salvarTrilha(v: { id?: string; titulo: string; descricao: string; tema_id: string | null; nivel_dificuldade: number }) {
  if (v.id) {
    const { id, ...campos } = v;
    return dados<Trilha>(supabase.from('trilhas').update(campos).eq('id', id).select(COLUNAS_TRILHA).single());
  }
  const curador_id = await meuId();
  return dados<Trilha>(supabase.from('trilhas').insert({ ...v, curador_id }).select(COLUNAS_TRILHA).single());
}

export async function definirItensTrilha(trilhaId: string, artigos: string[]) {
  await rpc('definir_itens_trilha', { p_trilha: trilhaId, p_artigos: artigos });
}

export async function publicarTrilha(id: string) {
  return dados(supabase.from('trilhas').update({ publicada: true }).eq('id', id).select('id').single());
}

export async function marcarLido(artigoId: string, trilhaId?: string | null): Promise<{ trilha_id: string; concluida: boolean }[]> {
  return rpc('marcar_artigo_lido', { p_artigo: artigoId, p_trilha: trilhaId ?? null });
}

/** Artigos publicados para montar trilhas */
export async function artigosPublicados(termo = ''): Promise<{ id: string; titulo: string; tema_id: string }[]> {
  let q = supabase.from('artigos').select('id, titulo, tema_id').eq('status', 'publicado').eq('oculto', false).order('publicado_em', { ascending: false }).limit(100);
  if (termo.trim()) q = q.ilike('titulo', `%${termo.trim()}%`);
  return dados(q);
}

// ------------------------------------------------------------------ salvos
export type TipoSalvo = 'topico' | 'artigo' | 'trilha';

export async function listarSalvos(): Promise<{ tipo: TipoSalvo; item_id: string; created_at: string; titulo: string }[]> {
  const eu = await meuId();
  const salvos = await dados<{ tipo: TipoSalvo; item_id: string; created_at: string }[]>(
    supabase.from('salvos').select('tipo, item_id, created_at').eq('profile_id', eu).order('created_at', { ascending: false }),
  );
  const porTipo = (t: TipoSalvo) => salvos.filter((s) => s.tipo === t).map((s) => s.item_id);
  const [topicos, artigos, trilhas] = await Promise.all([
    porTipo('topico').length ? dados<{ id: string; titulo: string }[]>(supabase.from('topicos').select('id, titulo').in('id', porTipo('topico'))) : [],
    porTipo('artigo').length ? dados<{ id: string; titulo: string }[]>(supabase.from('artigos').select('id, titulo').in('id', porTipo('artigo'))) : [],
    porTipo('trilha').length ? dados<{ id: string; titulo: string }[]>(supabase.from('trilhas').select('id, titulo').in('id', porTipo('trilha'))) : [],
  ]);
  const titulos = new Map([...topicos, ...artigos, ...trilhas].map((i) => [i.id, i.titulo]));
  return salvos.map((s) => ({ ...s, titulo: titulos.get(s.item_id) ?? 'Item indisponível' }));
}

export async function estaSalvo(tipo: TipoSalvo, itemId: string): Promise<boolean> {
  const eu = await meuId();
  const { count } = await supabase.from('salvos').select('item_id', { count: 'exact', head: true }).eq('profile_id', eu).eq('tipo', tipo).eq('item_id', itemId);
  return (count ?? 0) > 0;
}

export async function alternarSalvo(tipo: TipoSalvo, itemId: string, salvar: boolean) {
  const eu = await meuId();
  if (salvar) await dados(supabase.from('salvos').upsert({ profile_id: eu, tipo, item_id: itemId }));
  else await dados(supabase.from('salvos').delete().eq('profile_id', eu).eq('tipo', tipo).eq('item_id', itemId));
}

// ------------------------------------------------------------------ acervo
export const TAMANHO_PAGINA_ACERVO = 30;

export interface FiltroAcervo {
  termo?: string;
  categoria?: string | null;
  colecao?: string | null;
  assunto?: string | null;
}

export async function buscarAcervo(f: FiltroAcervo, pagina: number): Promise<DocumentoAcervo[]> {
  return rpc<DocumentoAcervo[]>('buscar_acervo', {
    p_termo: f.termo?.trim() || null,
    p_categoria: f.categoria ?? null,
    p_colecao: f.colecao ?? null,
    p_assunto: f.assunto ?? null,
    p_limite: TAMANHO_PAGINA_ACERVO,
    p_deslocamento: pagina * TAMANHO_PAGINA_ACERVO,
  });
}

export async function resumoAcervo(): Promise<ResumoAcervo[]> {
  return rpc<ResumoAcervo[]>('acervo_resumo');
}
