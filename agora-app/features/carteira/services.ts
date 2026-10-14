import { chamarFuncao, dados, dadosOuNulo, meuId, rpc, supabase } from '@/lib/supabase';
import type { Carteira, ConfigOnchain, CreditoDRC, MovimentoDRC } from './types';

export async function minhaCarteira(): Promise<Carteira | null> {
  const eu = await meuId();
  return dadosOuNulo(supabase.from('carteiras').select('*').eq('profile_id', eu).maybeSingle());
}

export async function meusCreditos(): Promise<CreditoDRC[]> {
  const eu = await meuId();
  return dados(supabase.from('creditos_drc').select('*, epoca:epocas_recompensa(inicio, fim, status, merkle_root)').eq('profile_id', eu).order('epoca_id', { ascending: false }));
}

export async function saldoPendente(): Promise<number> {
  return Number(await rpc<number | string>('meu_saldo_drc_pendente'));
}

export async function movimentos(endereco: string): Promise<MovimentoDRC[]> {
  const e = endereco.toLowerCase();
  return dados(supabase.from('movimentos_drc').select('*').or(`de.eq.${e},para.eq.${e}`).order('bloco', { ascending: false }).limit(50));
}

export async function delegacaoDe(endereco: string): Promise<string | null> {
  const linha = await dadosOuNulo<{ delegado: string }>(supabase.from('delegacoes').select('delegado').eq('delegante', endereco.toLowerCase()).maybeSingle());
  return linha?.delegado ?? null;
}

export async function carteirasPorNome(termo: string): Promise<{ profile_id: string; nome_publico: string; endereco: string; sbt_nivel: number | null }[]> {
  if (termo.trim().length < 2) return [];
  return dados(supabase.from('carteiras_publicas').select('*').ilike('nome_publico', `%${termo.trim()}%`).limit(10));
}

export async function configOnchain(): Promise<ConfigOnchain | null> {
  const linha = await dadosOuNulo<{ valor: ConfigOnchain }>(supabase.from('configuracoes').select('valor').eq('chave', 'onchain').maybeSingle());
  return linha?.valor ?? null;
}

/** Vincula o endereço à conta (o backend confere a assinatura e emite o SBT) */
export async function registrarCarteira(v: { endereco: string; mensagem: string; assinatura: string; tipo: 'embutida' | 'externa'; conta_dona?: string }) {
  return chamarFuncao<{ ok: boolean; sbt: string }>('registrar-carteira', v);
}

/** Resgate sem gas via relayer da Ágora (alternativa ao paymaster) */
export async function resgatarViaRelayer(epocas: number[]) {
  return chamarFuncao<{ tx: string }>('resgatar-drc', { epocas });
}
