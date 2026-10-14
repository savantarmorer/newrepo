import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as s from './services';

export function useHistoricoReputacao(profileId?: string) {
  return useInfiniteQuery({
    queryKey: ['reputacao', 'historico', profileId],
    queryFn: ({ pageParam }) => s.historico(profileId!, pageParam),
    enabled: !!profileId,
    initialPageParam: null as string | null,
    getNextPageParam: (ultima) => (ultima.length === 30 ? ultima[ultima.length - 1]!.criado_em : null),
  });
}

export function useLimiaresNiveis() {
  return useQuery({ queryKey: ['config', 'niveis'], queryFn: s.limiaresNiveis, staleTime: 60 * 60_000 });
}
