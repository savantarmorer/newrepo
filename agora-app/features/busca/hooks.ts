import { useQuery } from '@tanstack/react-query';
import { buscar } from './services';

export function useBusca(termo: string) {
  const t = termo.trim();
  return useQuery({ queryKey: ['busca', t], queryFn: () => buscar(t), enabled: t.length >= 3, staleTime: 60_000 });
}
