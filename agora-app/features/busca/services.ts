import { rpc } from '@/lib/supabase';

export type TipoResultado = 'topico' | 'artigo' | 'trilha' | 'projeto' | 'proposta' | 'decisao';

export interface ResultadoBusca {
  tipo: TipoResultado;
  id: string;
  titulo: string;
  trecho: string;
  rank: number;
  data: string | null;
}

export const ROTULOS_TIPO: Record<TipoResultado, string> = {
  topico: 'Tópicos',
  artigo: 'Artigos',
  trilha: 'Trilhas',
  projeto: 'Projetos',
  proposta: 'Propostas',
  decisao: 'Decisões',
};

export function rotaDoResultado(r: ResultadoBusca): string {
  switch (r.tipo) {
    case 'topico': return `/biblioteca/topico/${r.id}`;
    case 'artigo': return `/biblioteca/artigo/${r.id}`;
    case 'trilha': return `/biblioteca/trilha/${r.id}`;
    case 'projeto': return `/mutirao/projeto/${r.id}`;
    case 'proposta': return `/assembleia/proposta/${r.id}`;
    case 'decisao': return `/assembleia/decisoes?id=${r.id}`;
  }
}

export async function buscar(termo: string): Promise<Record<TipoResultado, ResultadoBusca[]>> {
  const lista = await rpc<ResultadoBusca[]>('buscar', { p_termo: termo, p_limite: 8 });
  const grupos = { topico: [], artigo: [], trilha: [], projeto: [], proposta: [], decisao: [] } as Record<TipoResultado, ResultadoBusca[]>;
  for (const r of lista) grupos[r.tipo].push(r);
  return grupos;
}
