import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as s from './services';

export const chavesAssembleia = {
  lista: (aba: string, nucleo?: string | null) => ['assembleia', 'lista', aba, nucleo ?? 'geral'] as const,
  proposta: (id: string) => ['assembleia', 'proposta', id] as const,
  comentarios: (id: string) => ['assembleia', 'comentarios', id] as const,
  decisoes: ['assembleia', 'decisoes'] as const,
  onchain: ['assembleia', 'onchain'] as const,
};

export const usePropostas = (aba: s.Aba, nucleoId?: string | null) =>
  useQuery({ queryKey: chavesAssembleia.lista(aba, nucleoId), queryFn: () => s.listarPropostas(aba, nucleoId) });
export const useProposta = (id?: string) =>
  useQuery({ queryKey: chavesAssembleia.proposta(id ?? ''), queryFn: () => s.buscarProposta(id!), enabled: !!id, refetchInterval: 60_000 });
export const useComentarios = (id?: string) =>
  useQuery({ queryKey: chavesAssembleia.comentarios(id ?? ''), queryFn: () => s.comentarios(id!), enabled: !!id });
export const usePodeVotar = (id?: string) => useQuery({ queryKey: ['assembleia', 'pode-votar', id], queryFn: () => s.podeVotar(id!), enabled: !!id });
export const useDecisoes = () => useQuery({ queryKey: chavesAssembleia.decisoes, queryFn: s.listarDecisoes });
export const usePropostasOnchain = () => useQuery({ queryKey: chavesAssembleia.onchain, queryFn: s.propostasOnchain, refetchInterval: 60_000 });
export const usePropostaOnchainDoApp = (id?: string) =>
  useQuery({ queryKey: ['assembleia', 'onchain-app', id], queryFn: () => s.propostaOnchainDoApp(id!), enabled: !!id });
export const useVotosOnchain = (id?: string) => useQuery({ queryKey: ['assembleia', 'votos-onchain', id], queryFn: () => s.votosOnchain(id!), enabled: !!id });

export function useInvalidarAssembleia() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['assembleia'] });
}
