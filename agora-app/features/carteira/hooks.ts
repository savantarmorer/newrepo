import { useQuery } from '@tanstack/react-query';
import * as s from './services';

export const useMinhaCarteira = () => useQuery({ queryKey: ['carteira', 'minha'], queryFn: s.minhaCarteira });
export const useMeusCreditos = () => useQuery({ queryKey: ['carteira', 'creditos'], queryFn: s.meusCreditos });
export const useSaldoPendente = () => useQuery({ queryKey: ['carteira', 'pendente'], queryFn: s.saldoPendente });
export const useMovimentos = (endereco?: string) =>
  useQuery({ queryKey: ['carteira', 'movimentos', endereco], queryFn: () => s.movimentos(endereco!), enabled: !!endereco });
export const useDelegacao = (endereco?: string) =>
  useQuery({ queryKey: ['carteira', 'delegacao', endereco], queryFn: () => s.delegacaoDe(endereco!), enabled: !!endereco });
export const useConfigOnchain = () => useQuery({ queryKey: ['config', 'onchain'], queryFn: s.configOnchain, staleTime: 10 * 60_000 });
export const useCarteirasPorNome = (termo: string) =>
  useQuery({ queryKey: ['carteira', 'busca', termo], queryFn: () => s.carteirasPorNome(termo), enabled: termo.trim().length >= 2 });
