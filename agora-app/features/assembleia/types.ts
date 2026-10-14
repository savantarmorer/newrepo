import type { PerfilPublico } from '../perfil/types';

export type StatusProposta = 'rascunho' | 'debate' | 'votacao' | 'aprovada' | 'rejeitada' | 'bloqueada' | 'retirada';
export type TipoProposta = 'geral' | 'financeira' | 'regimento' | 'nucleo';
export type OpcaoVoto = 'favor' | 'contra' | 'abstencao' | 'bloqueio';

export interface Proposta {
  id: string;
  autor_id: string;
  titulo: string;
  contexto_md: string;
  proposta_md: string;
  tipo: TipoProposta;
  natureza: 'comunitaria' | 'onchain';
  escopo_nucleo_id: string | null;
  status: StatusProposta;
  rodada: number;
  debate_iniciado_em: string | null;
  debate_ate: string | null;
  votacao_ate: string | null;
  quorum_minimo: number;
  limiar_aprovacao: number;
  membros_aptos: number | null;
  oculto: boolean;
  created_at: string;
  escopo?: { cidade: string; estado: string } | null;
  autor?: PerfilPublico;
}

export interface Placar {
  rodada: number;
  total: number;
  favor: number | null;
  contra: number | null;
  abstencao: number | null;
  bloqueio: number;
  quorum_exigido: number;
  encerrada: boolean;
}

export interface Voto {
  proposta_id: string;
  profile_id: string;
  rodada: number;
  voto: OpcaoVoto;
  justificativa: string | null;
  updated_at: string;
  perfil?: PerfilPublico;
}

export interface Decisao {
  id: string;
  proposta_id: string;
  rodada: number;
  resultado: 'aprovada' | 'rejeitada' | 'bloqueada';
  resumo_md: string;
  total_votos: number;
  votos_favor: number;
  votos_contra: number;
  abstencoes: number;
  bloqueios: number;
  quorum_exigido: number;
  quorum_atingido: boolean;
  registrada_em: string;
  proposta?: { titulo: string; tipo: TipoProposta } | null;
}

export interface Comentario {
  id: string;
  proposta_id: string;
  autor_id: string;
  corpo_md: string;
  resposta_pai_id: string | null;
  oculto: boolean;
  editado_em: string | null;
  created_at: string;
  autor?: PerfilPublico;
  filhos?: Comentario[];
}

export type EstadoOnchain = 'pendente' | 'ativa' | 'cancelada' | 'derrotada' | 'aprovada' | 'na_fila' | 'expirada' | 'executada';

export interface PropostaOnchain {
  proposal_id: string;
  proposta_id_app: string | null;
  proponente: string;
  descricao: string;
  acoes: { alvo: string; funcao: string; args: unknown[] }[];
  estado: EstadoOnchain;
  modo_voto: string | null;
  votos_favor: string;
  votos_contra: string;
  abstencoes: string;
  quorum: string | null;
  bloco_snapshot: number | null;
  bloco_fim: number | null;
  eta: string | null;
  tx_criacao: string | null;
  tx_execucao: string | null;
  atualizado_em: string;
}

export const ROTULO_TIPO: Record<TipoProposta, string> = {
  geral: 'Geral', financeira: 'Financeira', regimento: 'Regimento', nucleo: 'Núcleo',
};
export const ROTULO_STATUS: Record<StatusProposta, string> = {
  rascunho: 'Rascunho', debate: 'Em debate', votacao: 'Em votação', aprovada: 'Aprovada',
  rejeitada: 'Rejeitada', bloqueada: 'Bloqueada', retirada: 'Retirada',
};
export const ROTULO_VOTO: Record<OpcaoVoto, string> = {
  favor: 'A favor', contra: 'Contra', abstencao: 'Abstenção', bloqueio: 'Bloqueio',
};
export const ROTULO_ESTADO_ONCHAIN: Record<EstadoOnchain, string> = {
  pendente: 'Pendente', ativa: 'Votação aberta', cancelada: 'Cancelada', derrotada: 'Derrotada',
  aprovada: 'Aprovada', na_fila: 'Na fila do timelock (48h)', expirada: 'Expirada', executada: 'Executada',
};
