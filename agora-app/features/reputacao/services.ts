import { rpc, dados, supabase } from '@/lib/supabase';
import { LIMIARES_PADRAO } from '@/lib/constantes';

export interface EventoReputacao {
  id: string;
  acao: string;
  pontos: number;
  referencia_tipo: string | null;
  referencia_id: string | null;
  criado_em: string;
}

export async function historico(profileId: string, antes?: string | null): Promise<EventoReputacao[]> {
  return rpc('historico_reputacao', { p_profile: profileId, p_limite: 30, p_antes: antes ?? null });
}

export async function limiaresNiveis(): Promise<Record<number, number>> {
  const linha = await dados<{ valor: Record<string, number> } | null>(
    supabase.from('configuracoes').select('valor').eq('chave', 'niveis').maybeSingle(),
  );
  if (!linha) return LIMIARES_PADRAO;
  return Object.fromEntries(Object.entries(linha.valor).map(([k, v]) => [Number(k), Number(v)]));
}

/** Progresso até o próximo nível (0..1) e pontos que faltam */
export function progressoNivel(total: number, nivel: number, limiares: Record<number, number>) {
  if (nivel >= 4) return { pct: 1, faltam: 0, proximo: null as number | null };
  const atual = limiares[nivel] ?? 0;
  const prox = limiares[nivel + 1] ?? atual + 1;
  const pct = Math.max(0, Math.min(1, (Math.max(0, total) - atual) / (prox - atual)));
  return { pct, faltam: Math.max(0, prox - total), proximo: nivel + 1 };
}
