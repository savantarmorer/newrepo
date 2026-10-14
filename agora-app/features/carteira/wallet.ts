/**
 * Carteira embutida — thirdweb In-App Wallet + smart account ERC-4337 com gas patrocinado.
 *
 * Por que thirdweb (e não Privy): o SDK v5 da thirdweb já traz, num pacote só, carteira
 * embutida com autenticação por JWT próprio (usamos o JWT do Supabase, então a carteira
 * nasce no login sem frase-semente), smart account 4337 e paymaster gerenciado com
 * `sponsorGas: true` em Base/Base Sepolia/Polygon — sem precisarmos operar bundler ou
 * paymaster. A Privy exigiria configurar um provedor de paymaster à parte (Pimlico etc.).
 *
 * Os módulos nativos (crypto) não existem no Expo Go: por isso tudo é carregado sob demanda
 * e, no Expo Go, as funções on-chain ficam indisponíveis (o resgate usa o relayer).
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { env } from '@/lib/env';

type ThirdwebModulos = {
  tw: typeof import('thirdweb');
  wallets: typeof import('thirdweb/wallets');
  chains: typeof import('thirdweb/chains');
};

let modulos: ThirdwebModulos | null = null;
let contaAtual: import('thirdweb/wallets').Account | null = null;
let clienteAtual: import('thirdweb').ThirdwebClient | null = null;

export const carteiraDisponivel = () =>
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && !!env.thirdwebClientId;

function carregar(): ThirdwebModulos {
  if (modulos) return modulos;
  if (!carteiraDisponivel()) {
    throw new Error('A carteira embutida precisa do app instalado (build EAS) e do EXPO_PUBLIC_THIRDWEB_CLIENT_ID.');
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@thirdweb-dev/react-native-adapter');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  modulos = { tw: require('thirdweb'), wallets: require('thirdweb/wallets'), chains: require('thirdweb/chains') };
  return modulos;
}

function rede(m: ThirdwebModulos) {
  switch (env.rede) {
    case 'base': return m.chains.base;
    case 'polygon': return m.chains.polygon;
    case 'polygon-amoy': return m.chains.polygonAmoy;
    default: return m.chains.baseSepolia;
  }
}

function cliente(m: ThirdwebModulos) {
  clienteAtual ??= m.tw.createThirdwebClient({ clientId: env.thirdwebClientId });
  return clienteAtual;
}

/** Cria/recupera a carteira embutida a partir do JWT da sessão do Supabase. */
export async function conectarCarteiraEmbutida(jwtSupabase: string): Promise<{ endereco: string; dona: string }> {
  const m = carregar();
  const carteira = m.wallets.inAppWallet({
    executionMode: { mode: 'EIP4337', smartAccount: { chain: rede(m), sponsorGas: true } },
  });
  contaAtual = await carteira.connect({ client: cliente(m), strategy: 'jwt', jwt: jwtSupabase });
  const dona = carteira.getAdminAccount?.()?.address ?? contaAtual.address;
  return { endereco: contaAtual.address.toLowerCase(), dona: dona.toLowerCase() };
}

/** Opção avançada: conectar carteira externa via WalletConnect */
export async function conectarCarteiraExterna(): Promise<{ endereco: string }> {
  const m = carregar();
  const wc = m.wallets.walletConnect();
  contaAtual = await wc.connect({ client: cliente(m), chain: rede(m) });
  return { endereco: contaAtual.address.toLowerCase() };
}

export async function assinarMensagem(mensagem: string): Promise<string> {
  if (!contaAtual) throw new Error('Conecte a carteira primeiro.');
  return contaAtual.signMessage({ message: mensagem });
}

function contrato(endereco: string) {
  const m = carregar();
  return m.tw.getContract({ client: cliente(m), chain: rede(m), address: endereco });
}

async function enviar(endereco: string, metodo: string, params: unknown[]): Promise<string> {
  const m = carregar();
  if (!contaAtual) throw new Error('Conecte a carteira primeiro.');
  const tx = m.tw.prepareContractCall({ contract: contrato(endereco), method: metodo, params } as never);
  const r = await m.tw.sendTransaction({ transaction: tx, account: contaAtual });
  return r.transactionHash;
}

export async function lerSaldo(token: string, endereco: string): Promise<bigint> {
  const m = carregar();
  return m.tw.readContract({ contract: contrato(token), method: 'function balanceOf(address) view returns (uint256)', params: [endereco] });
}

export async function lerVotos(token: string, endereco: string): Promise<bigint> {
  const m = carregar();
  return m.tw.readContract({ contract: contrato(token), method: 'function getVotes(address) view returns (uint256)', params: [endereco] });
}

export async function lerPoderDeVoto(governor: string, endereco: string, bloco: bigint): Promise<bigint> {
  const m = carregar();
  return m.tw.readContract({ contract: contrato(governor), method: 'function poderDeVoto(address,uint256) view returns (uint256)', params: [endereco, bloco] });
}

/** Resgate com gas patrocinado (paymaster) — um toque */
export const resgatar = (distribuidor: string, epoca: number, conta: string, valorWei: string, prova: string[]) =>
  enviar(distribuidor, 'function resgatar(uint256,address,uint256,bytes32[])', [BigInt(epoca), conta, BigInt(valorWei), prova]);

export const delegar = (token: string, para: string) => enviar(token, 'function delegate(address)', [para]);

export const transferir = (token: string, para: string, valorWei: bigint) =>
  enviar(token, 'function transfer(address,uint256) returns (bool)', [para, valorWei]);

/** Voto on-chain (0 contra, 1 a favor, 2 abstenção) — um toque, gas patrocinado */
export const votarOnchain = (governor: string, proposalId: string, suporte: 0 | 1 | 2, motivo: string) =>
  enviar(governor, 'function castVoteWithReason(uint256,uint8,string) returns (uint256)', [BigInt(proposalId), suporte, motivo]);

export const proporOnchain = (governor: string, alvos: string[], valores: bigint[], dados: string[], descricao: string) =>
  enviar(governor, 'function propose(address[],uint256[],bytes[],string) returns (uint256)', [alvos, valores, dados, descricao]);

/** Codifica `FundoMutirao.liberar(token, destino, valor, referencia)` para uma proposta on-chain */
export async function codificarLiberacaoFundo(fundo: string, token: string, destino: string, valorWei: bigint, referencia: string): Promise<string> {
  const m = carregar();
  const tx = m.tw.prepareContractCall({
    contract: contrato(fundo),
    method: 'function liberar(address,address,uint256,string)',
    params: [token, destino, valorWei, referencia],
  });
  return m.tw.encode(tx);
}

export function desconectar() {
  contaAtual = null;
}
