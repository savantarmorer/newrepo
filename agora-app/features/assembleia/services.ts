import { dados, dadosOuNulo, meuId, rpc, supabase } from '@/lib/supabase';
import { anexarPerfis, perfisPorIds } from '../comum';
import type { Comentario, Decisao, OpcaoVoto, Placar, Proposta, PropostaOnchain, TipoProposta, Voto } from './types';

const CAMPOS = 'id, autor_id, titulo, contexto_md, proposta_md, tipo, natureza, escopo_nucleo_id, status, rodada, debate_iniciado_em, debate_ate, votacao_ate, quorum_minimo, limiar_aprovacao, membros_aptos, oculto, created_at, escopo:nucleos(cidade, estado)';

export type Aba = 'debate' | 'votacao' | 'decididas' | 'minhas';

export async function listarPropostas(aba: Aba, nucleoId?: string | null): Promise<Proposta[]> {
  let q = supabase.from('propostas').select(CAMPOS).is('excluido_em', null);
  if (aba === 'debate') q = q.eq('status', 'debate').order('debate_ate');
  else if (aba === 'votacao') q = q.eq('status', 'votacao').order('votacao_ate');
  else if (aba === 'decididas') q = q.in('status', ['aprovada', 'rejeitada', 'retirada']).order('votacao_ate', { ascending: false, nullsFirst: false });
  else q = q.eq('autor_id', await meuId()).order('created_at', { ascending: false });
  if (nucleoId) q = q.eq('escopo_nucleo_id', nucleoId);
  return anexarPerfis(await dados<Proposta[]>(q), 'autor_id') as Promise<Proposta[]>;
}

export async function buscarProposta(id: string) {
  const p = await dadosOuNulo<Proposta>(supabase.from('propostas').select(CAMPOS).eq('id', id).maybeSingle());
  if (!p) return null;
  const eu = await meuId();
  const [placar, votosVisiveis, decisoes] = await Promise.all([
    rpc<Placar[]>('placar_proposta', { p_proposta: id }).then((l) => l[0] ?? null),
    dados<Voto[]>(supabase.from('votos').select('*').eq('proposta_id', id).order('updated_at')),
    dados<Decisao[]>(supabase.from('decisoes').select('*').eq('proposta_id', id).order('rodada')),
  ]);
  const perfis = await perfisPorIds([p.autor_id, ...votosVisiveis.map((v) => v.profile_id)]);
  const votos = votosVisiveis.map((v) => ({ ...v, perfil: perfis[v.profile_id] }));
  return {
    proposta: { ...p, autor: perfis[p.autor_id] },
    placar,
    meuVoto: votos.find((v) => v.profile_id === eu && v.rodada === p.rodada) ?? null,
    bloqueios: votos.filter((v) => v.voto === 'bloqueio' && v.rodada === p.rodada),
    votosNominais: votos.filter((v) => v.rodada < p.rodada || ['aprovada', 'rejeitada'].includes(p.status)),
    decisoes,
  };
}

export async function podeVotar(id: string): Promise<boolean> {
  return rpc('pode_votar', { p_proposta: id });
}

export async function votar(propostaId: string, rodada: number, voto: OpcaoVoto, justificativa?: string) {
  const profile_id = await meuId();
  return dados(
    supabase.from('votos').upsert(
      { proposta_id: propostaId, profile_id, rodada, voto, justificativa: justificativa?.trim() || null, peso: 1 },
      { onConflict: 'proposta_id,profile_id,rodada' },
    ),
  );
}

export async function comentarios(propostaId: string): Promise<Comentario[]> {
  const lista = await anexarPerfis(
    await dados<Comentario[]>(supabase.from('proposta_comentarios').select('*').eq('proposta_id', propostaId).is('excluido_em', null).order('created_at')),
    'autor_id',
  );
  const porId = new Map<string, Comentario>(lista.map((c) => [c.id, { ...c, filhos: [] }]));
  const raiz: Comentario[] = [];
  for (const c of porId.values()) {
    if (c.resposta_pai_id && porId.has(c.resposta_pai_id)) porId.get(c.resposta_pai_id)!.filhos!.push(c);
    else raiz.push(c);
  }
  return raiz;
}

export async function comentar(propostaId: string, corpo: string, paiId?: string | null) {
  const autor_id = await meuId();
  return dados(supabase.from('proposta_comentarios').insert({ proposta_id: propostaId, autor_id, corpo_md: corpo, resposta_pai_id: paiId ?? null }));
}

export interface NovaProposta {
  id?: string;
  titulo: string;
  contexto_md: string;
  proposta_md: string;
  tipo: TipoProposta;
  escopo_nucleo_id: string | null;
  debate_ate: string;
  votacao_ate: string;
  abrirDebate: boolean;
}

export async function salvarProposta(v: NovaProposta) {
  const { id, abrirDebate, ...campos } = v;
  const status = abrirDebate ? 'debate' : 'rascunho';
  if (id) return dados<Proposta>(supabase.from('propostas').update({ ...campos, status }).eq('id', id).select('id').single());
  const autor_id = await meuId();
  return dados<Proposta>(supabase.from('propostas').insert({ ...campos, status, autor_id }).select('id').single());
}

export async function retirarProposta(id: string) {
  return dados(supabase.from('propostas').update({ status: 'retirada' }).eq('id', id));
}

export async function listarDecisoes(): Promise<Decisao[]> {
  return dados(supabase.from('decisoes').select('*, proposta:propostas(titulo, tipo)').order('registrada_em', { ascending: false }).limit(200));
}

export async function propostasOnchain(): Promise<PropostaOnchain[]> {
  return dados(supabase.from('propostas_onchain').select('*').order('created_at', { ascending: false }));
}

export async function propostaOnchainDoApp(propostaId: string): Promise<PropostaOnchain | null> {
  return dadosOuNulo(supabase.from('propostas_onchain').select('*').eq('proposta_id_app', propostaId).order('created_at', { ascending: false }).limit(1).maybeSingle());
}

export async function votosOnchain(proposalId: string) {
  return dados<{ eleitor: string; suporte: number; peso: string; motivo: string | null }[]>(
    supabase.from('votos_onchain').select('eleitor, suporte, peso, motivo').eq('proposal_id', proposalId),
  );
}
