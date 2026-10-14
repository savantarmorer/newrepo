import { dados, supabase } from '@/lib/supabase';
import type { PerfilPublico } from './perfil/types';

export const TAMANHO_PAGINA = 20;

/** Busca perfis públicos (respeitando pseudônimos) para uma lista de ids. */
export async function perfisPorIds(ids: (string | null | undefined)[]): Promise<Record<string, PerfilPublico>> {
  const unicos = [...new Set(ids.filter((i): i is string => !!i))];
  if (!unicos.length) return {};
  const lista = await dados<PerfilPublico[]>(supabase.from('perfis_publicos').select('*').in('id', unicos));
  return Object.fromEntries(lista.map((p) => [p.id, p]));
}

/** Anexa `autor` (ou outro nome) a cada item a partir do campo de id informado. */
export async function anexarPerfis<T extends object, K extends keyof T, N extends string = 'autor'>(
  itens: T[],
  campo: K,
  nome?: N,
): Promise<(T & Record<N, PerfilPublico | undefined>)[]> {
  const mapa = await perfisPorIds(itens.map((i) => i[campo] as unknown as string));
  const chave = (nome ?? 'autor') as N;
  return itens.map((i) => ({ ...i, [chave]: mapa[i[campo] as unknown as string] }) as T & Record<N, PerfilPublico | undefined>);
}

export interface Pagina<T> {
  itens: T[];
  proximo: string | null;
}

export function paginar<T>(itens: T[], campoCursor: keyof T): Pagina<T> {
  const ultimo = itens[itens.length - 1];
  return {
    itens,
    proximo: itens.length >= TAMANHO_PAGINA && ultimo ? String(ultimo[campoCursor]) : null,
  };
}
