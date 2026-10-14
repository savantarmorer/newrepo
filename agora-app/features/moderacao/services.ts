import { dados, meuId, rpc, supabase } from '@/lib/supabase';
import { anexarPerfis } from '../comum';

export type TipoItem = 'topico' | 'resposta' | 'artigo' | 'proposta' | 'proposta_comentario' | 'projeto' | 'evento' | 'perfil';
export type AcaoModeracao = 'manter' | 'ocultar' | 'restaurar' | 'advertir' | 'suspender' | 'descartar';

export const ROTULO_ITEM: Record<TipoItem, string> = {
  topico: 'Tópico', resposta: 'Resposta', artigo: 'Artigo', proposta: 'Proposta',
  proposta_comentario: 'Comentário', projeto: 'Projeto', evento: 'Evento', perfil: 'Perfil',
};

export const ROTULO_ACAO: Record<AcaoModeracao, string> = {
  manter: 'Mantido', ocultar: 'Ocultado', restaurar: 'Restaurado (recurso)', advertir: 'Advertência',
  suspender: 'Suspensão', descartar: 'Denúncia descartada',
};

export interface Denuncia {
  id: string;
  denunciante_id: string;
  tipo_item: TipoItem;
  item_id: string;
  motivo: string;
  status: 'aberta' | 'resolvida' | 'descartada';
  resolucao: string | null;
  created_at: string;
}

export interface RegistroModeracao {
  id: string;
  acao: AcaoModeracao;
  item_tipo: TipoItem;
  item_id: string;
  motivo: string;
  criado_em: string;
  moderador_nome: string | null;
}

export async function denunciar(tipo: TipoItem, itemId: string, motivo: string) {
  const id = await meuId();
  await dados(supabase.from('denuncias').insert({ denunciante_id: id, tipo_item: tipo, item_id: itemId, motivo }));
}

export async function filaDenuncias(status: 'aberta' | 'resolvida' = 'aberta') {
  const lista = await dados<Denuncia[]>(supabase.from('denuncias').select('*').eq('status', status).order('created_at', { ascending: status === 'aberta' }).limit(100));
  return anexarPerfis(lista, 'denunciante_id', 'denunciante');
}

export async function resolverDenuncia(id: string, acao: AcaoModeracao, motivo: string, dias?: number) {
  await rpc('resolver_denuncia', { p_denuncia: id, p_acao: acao, p_motivo: motivo, p_dias: dias ?? null });
}

export async function moderarItem(tipo: TipoItem, itemId: string, acao: AcaoModeracao, motivo: string) {
  await rpc('moderar_item', { p_tipo: tipo, p_id: itemId, p_acao: acao, p_motivo: motivo, p_dias: null });
}

export async function logPublico(antes?: string | null): Promise<RegistroModeracao[]> {
  let q = supabase.from('log_moderacao_publico').select('id, acao, item_tipo, item_id, motivo, criado_em, moderador_nome').order('criado_em', { ascending: false }).limit(30);
  if (antes) q = q.lt('criado_em', antes);
  return dados(q);
}

/** Texto original de item oculto (somente admins conseguem ler) */
export async function conteudoOriginal(tipo: TipoItem, id: string) {
  return dados<{ titulo_original: string | null; corpo_original: string | null } | null>(
    supabase.from('conteudo_oculto').select('titulo_original, corpo_original').eq('item_tipo', tipo).eq('item_id', id).maybeSingle(),
  );
}

export function rotaDoItem(tipo: TipoItem, id: string): string | null {
  switch (tipo) {
    case 'topico': return `/biblioteca/topico/${id}`;
    case 'artigo': return `/biblioteca/artigo/${id}`;
    case 'proposta': return `/assembleia/proposta/${id}`;
    case 'projeto': return `/mutirao/projeto/${id}`;
    case 'evento': return `/mutirao/evento/${id}`;
    case 'perfil': return `/perfil/membro/${id}`;
    default: return null;
  }
}
