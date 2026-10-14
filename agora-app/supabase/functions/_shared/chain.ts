/**
 * Acesso à blockchain (viem). As chaves privadas do backend ficam SOMENTE em
 * variáveis de ambiente das Edge Functions:
 *   AGORA_RPC_URL           RPC da rede (Base Sepolia por padrão)
 *   AGORA_BACKEND_PK        chave com PUBLICADOR_ROLE (distribuidor) e EMISSOR_ROLE (SBT); paga o gas do relayer
 */
import { createPublicClient, createWalletClient, http, parseAbi, parseAbiItem, type Address, type Hex } from 'npm:viem@2';
import { privateKeyToAccount } from 'npm:viem@2/accounts';
import { base, baseSepolia, polygon, polygonAmoy } from 'npm:viem@2/chains';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { ErroHttp, variavel } from './http.ts';

export interface ConfigOnchain {
  rede: string;
  chain_id: number;
  explorador: string;
  token: Address | null;
  reputacao_sbt: Address | null;
  governor: Address | null;
  timelock: Address | null;
  distribuidor: Address | null;
  fundo_mutirao: Address | null;
  bloco_implantacao?: number;
}

export async function lerConfig(db: SupabaseClient): Promise<ConfigOnchain> {
  const { data } = await db.from('configuracoes').select('valor').eq('chave', 'onchain').single();
  const cfg = data?.valor as ConfigOnchain | undefined;
  if (!cfg?.token || !cfg.distribuidor || !cfg.reputacao_sbt || !cfg.governor) {
    throw new ErroHttp(503, 'Contratos ainda não configurados em configuracoes.onchain');
  }
  return cfg;
}

function cadeia(chainId: number) {
  return { 84532: baseSepolia, 8453: base, 80002: polygonAmoy, 137: polygon }[chainId] ?? baseSepolia;
}

export function clientes(cfg: ConfigOnchain, comCarteira = false) {
  const chain = cadeia(cfg.chain_id);
  const transport = http(variavel('AGORA_RPC_URL'));
  const publico = createPublicClient({ chain, transport });
  const carteira = comCarteira
    ? createWalletClient({ chain, transport, account: privateKeyToAccount(variavel('AGORA_BACKEND_PK') as Hex) })
    : null;
  return { publico, carteira };
}

export const abiDistribuidor = parseAbi([
  'function proximaEpoca() view returns (uint256)',
  'function fimDaEpoca(uint256) view returns (uint256)',
  'function tetoDaEpoca(uint256) view returns (uint256)',
  'function publicarEpoca(uint256 epoca, bytes32 raiz, uint256 total)',
  'function resgatar(uint256 epoca, address conta, uint256 valor, bytes32[] prova)',
  'function resgatado(uint256, address) view returns (bool)',
]);

export const abiSbt = parseAbi([
  'function emitir(address membro, uint8 nivel) returns (uint256)',
  'function atualizarNivel(address membro, uint8 nivel)',
  'function revogar(address membro)',
  'function tokenDe(address) view returns (uint256)',
  'function nivelDe(address) view returns (uint8)',
]);

export const abiGovernor = parseAbi([
  'function state(uint256) view returns (uint8)',
  'function proposalVotes(uint256) view returns (uint256 contra, uint256 aFavor, uint256 abstencao, uint256 participacaoBruta)',
  'function quorum(uint256) view returns (uint256)',
  'function proposalEta(uint256) view returns (uint256)',
  'function modoDaProposta(uint256) view returns (uint8)',
]);

export const eventos = {
  transfer: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
  delegado: parseAbiItem('event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)'),
  propostaCriada: parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)'),
  voto: parseAbiItem('event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)'),
  executada: parseAbiItem('event ProposalExecuted(uint256 proposalId)'),
  resgate: parseAbiItem('event Resgate(uint256 indexed epoca, address indexed conta, uint256 valor)'),
};

/** IGovernor.ProposalState → estado espelhado no Supabase */
export const ESTADOS = ['pendente', 'ativa', 'cancelada', 'derrotada', 'aprovada', 'na_fila', 'expirada', 'executada'] as const;
export const MODOS = ['classico', 'quadratico', 'hibrido'] as const;
