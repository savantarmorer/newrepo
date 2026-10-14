import { dados, dadosOuNulo, meuId, rpc, supabase, chamarFuncao } from '@/lib/supabase';
import type { MeuPerfil, Nucleo, PerfilPublico } from './types';

export async function buscarMeuPerfil(): Promise<MeuPerfil | null> {
  const id = await meuId();
  return dadosOuNulo<MeuPerfil>(supabase.from('profiles').select('*').eq('id', id).maybeSingle());
}

export async function atualizarMeuPerfil(campos: Partial<MeuPerfil>) {
  const id = await meuId();
  return dados(supabase.from('profiles').update(campos).eq('id', id).select('*').single());
}

export async function buscarPerfilPublico(id: string): Promise<PerfilPublico | null> {
  return dadosOuNulo<PerfilPublico>(supabase.from('perfis_publicos').select('*').eq('id', id).maybeSingle());
}

export async function buscarMembros(termo: string): Promise<PerfilPublico[]> {
  const t = termo.trim();
  if (t.length < 2) return [];
  return dados(supabase.from('perfis_publicos').select('*').ilike('nome_publico', `%${t}%`).eq('removido', false).limit(15));
}

export async function listarNucleos(): Promise<Nucleo[]> {
  return dados(supabase.from('nucleos').select('*').order('estado').order('cidade'));
}

export async function listarTemasSimples(): Promise<{ id: string; nome: string; slug: string }[]> {
  return dados(supabase.from('temas').select('id, nome, slug').order('ordem'));
}

export async function configuracao<T>(chave: string): Promise<T | null> {
  const linha = await dadosOuNulo<{ valor: T }>(supabase.from('configuracoes').select('valor').eq('chave', chave).maybeSingle());
  return linha?.valor ?? null;
}

export async function exportarMeusDados(): Promise<unknown> {
  return rpc('exportar_meus_dados');
}

/** Anonimiza o conteúdo e encerra o acesso (Edge Function remove o login). */
export async function excluirMinhaConta() {
  return chamarFuncao<{ ok: boolean }>('excluir-conta');
}

export async function trilhasConcluidasDe(profileId: string) {
  return dados<{ trilha_id: string; concluida_em: string; trilha: { titulo: string; tema_id: string | null } | null }[]>(
    supabase.from('trilhas_concluidas').select('trilha_id, concluida_em, trilha:trilhas(titulo, tema_id)').eq('profile_id', profileId).order('concluida_em', { ascending: false }),
  );
}

export interface Contribuicoes {
  artigos: { id: string; titulo: string; status: string; publicado_em: string | null; papel: string }[];
  revisoes: number;
  trilhas: { id: string; titulo: string; publicada: boolean }[];
  horasConfirmadas: number;
  projetos: { id: string; titulo: string; papel: string; status: string }[];
  presencas: number;
  propostas: { id: string; titulo: string; status: string }[];
}

export async function contribuicoesDe(profileId: string): Promise<Contribuicoes> {
  const [autoria, revisoes, trilhas, horas, projetos, presencas, propostas] = await Promise.all([
    dados<{ papel: string; artigo: { id: string; titulo: string; status: string; publicado_em: string | null } | null }[]>(
      supabase.from('artigo_autores').select('papel, artigo:artigos(id, titulo, status, publicado_em)').eq('profile_id', profileId),
    ),
    supabase.from('revisoes').select('id', { count: 'exact', head: true }).eq('revisor_id', profileId),
    dados<{ id: string; titulo: string; publicada: boolean }[]>(supabase.from('trilhas').select('id, titulo, publicada').eq('curador_id', profileId)),
    dados<{ horas: number }[]>(supabase.from('horas_voluntariado').select('horas').eq('profile_id', profileId).not('confirmado_em', 'is', null)),
    dados<{ papel: string; projeto: { id: string; titulo: string; status: string } | null }[]>(
      supabase.from('projeto_membros').select('papel, projeto:projetos(id, titulo, status)').eq('profile_id', profileId),
    ),
    supabase.from('rsvps').select('evento_id', { count: 'exact', head: true }).eq('profile_id', profileId).eq('presente', true),
    dados<{ id: string; titulo: string; status: string }[]>(
      supabase.from('propostas').select('id, titulo, status').eq('autor_id', profileId).neq('status', 'rascunho').order('created_at', { ascending: false }),
    ),
  ]);
  return {
    artigos: autoria
      .filter((a) => a.artigo && (a.papel !== 'revisor'))
      .map((a) => ({ ...(a.artigo as NonNullable<typeof a.artigo>), papel: a.papel })),
    revisoes: revisoes.count ?? 0,
    trilhas,
    horasConfirmadas: horas.reduce((s, h) => s + Number(h.horas), 0),
    projetos: projetos.filter((p) => p.projeto).map((p) => ({ ...(p.projeto as NonNullable<typeof p.projeto>), papel: p.papel })),
    presencas: presencas.count ?? 0,
    propostas,
  };
}
