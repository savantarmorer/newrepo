import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessao } from '@/stores/sessao';
import * as s from './services';
import type { MeuPerfil } from './types';

export const chavesPerfil = {
  eu: ['perfil', 'eu'] as const,
  publico: (id: string) => ['perfil', 'publico', id] as const,
  contribuicoes: (id: string) => ['perfil', 'contribuicoes', id] as const,
  nucleos: ['nucleos'] as const,
  temas: ['temas', 'simples'] as const,
};

export function useMeuPerfil() {
  const sessao = useSessao((st) => st.sessao);
  return useQuery({
    queryKey: [...chavesPerfil.eu, sessao?.user.id],
    queryFn: s.buscarMeuPerfil,
    enabled: !!sessao,
    staleTime: 30_000,
  });
}

export function useAtualizarPerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campos: Partial<MeuPerfil>) => s.atualizarMeuPerfil(campos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chavesPerfil.eu });
      qc.invalidateQueries({ queryKey: ['perfil', 'publico'] });
    },
  });
}

export function usePerfilPublico(id?: string) {
  return useQuery({ queryKey: chavesPerfil.publico(id ?? ''), queryFn: () => s.buscarPerfilPublico(id!), enabled: !!id });
}

export function useContribuicoes(id?: string) {
  return useQuery({ queryKey: chavesPerfil.contribuicoes(id ?? ''), queryFn: () => s.contribuicoesDe(id!), enabled: !!id });
}

export function useTrilhasConcluidas(id?: string) {
  return useQuery({ queryKey: ['trilhas-concluidas', id], queryFn: () => s.trilhasConcluidasDe(id!), enabled: !!id });
}

export function useNucleos() {
  return useQuery({ queryKey: chavesPerfil.nucleos, queryFn: s.listarNucleos, staleTime: 10 * 60_000 });
}

export function useTemasSimples() {
  return useQuery({ queryKey: chavesPerfil.temas, queryFn: s.listarTemasSimples, staleTime: 10 * 60_000 });
}

export function useConfiguracao<T>(chave: string) {
  return useQuery({ queryKey: ['config', chave], queryFn: () => s.configuracao<T>(chave), staleTime: 10 * 60_000 });
}

export function useBuscaMembros(termo: string) {
  return useQuery({ queryKey: ['membros', 'busca', termo], queryFn: () => s.buscarMembros(termo), enabled: termo.trim().length >= 2 });
}
