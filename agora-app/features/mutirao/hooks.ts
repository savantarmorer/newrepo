import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as s from './services';

export const chavesMutirao = {
  projetos: (f: object) => ['mutirao', 'projetos', f] as const,
  projeto: (id: string) => ['mutirao', 'projeto', id] as const,
  tarefas: (id: string) => ['mutirao', 'tarefas', id] as const,
  tarefa: (id: string) => ['mutirao', 'tarefa', id] as const,
  minhasTarefas: ['mutirao', 'minhas-tarefas'] as const,
  horas: (id: string) => ['mutirao', 'horas', id] as const,
  caixa: (id: string) => ['mutirao', 'caixa', id] as const,
  mensal: (id: string) => ['mutirao', 'caixa-mensal', id] as const,
  eventos: (f: object) => ['mutirao', 'eventos', f] as const,
  evento: (id: string) => ['mutirao', 'evento', id] as const,
  nucleo: (id: string) => ['mutirao', 'nucleo', id] as const,
};

export const useProjetos = (f: Parameters<typeof s.listarProjetos>[0]) =>
  useQuery({ queryKey: chavesMutirao.projetos(f), queryFn: () => s.listarProjetos(f) });
export const useProjeto = (id?: string) => useQuery({ queryKey: chavesMutirao.projeto(id ?? ''), queryFn: () => s.buscarProjeto(id!), enabled: !!id });
export const useTarefas = (id?: string) => useQuery({ queryKey: chavesMutirao.tarefas(id ?? ''), queryFn: () => s.tarefasDoProjeto(id!), enabled: !!id });
export const useTarefa = (id?: string) => useQuery({ queryKey: chavesMutirao.tarefa(id ?? ''), queryFn: () => s.buscarTarefa(id!), enabled: !!id });
export const useMinhasTarefas = () => useQuery({ queryKey: chavesMutirao.minhasTarefas, queryFn: s.minhasTarefas });
export const useHorasProjeto = (id?: string) => useQuery({ queryKey: chavesMutirao.horas(id ?? ''), queryFn: () => s.horasDoProjeto(id!), enabled: !!id });
export const useCaixa = (id?: string) => useQuery({ queryKey: chavesMutirao.caixa(id ?? ''), queryFn: () => s.lancamentos(id!), enabled: !!id });
export const useCaixaMensal = (id?: string) => useQuery({ queryKey: chavesMutirao.mensal(id ?? ''), queryFn: () => s.caixaMensal(id!), enabled: !!id });
export const useEventos = (f: Parameters<typeof s.listarEventos>[0]) => useQuery({ queryKey: chavesMutirao.eventos(f), queryFn: () => s.listarEventos(f) });
export const useEvento = (id?: string) => useQuery({ queryKey: chavesMutirao.evento(id ?? ''), queryFn: () => s.buscarEvento(id!), enabled: !!id });
export const useNucleo = (id?: string) => useQuery({ queryKey: chavesMutirao.nucleo(id ?? ''), queryFn: () => s.buscarNucleo(id!), enabled: !!id });

/** Invalida tudo do Mutirão (e o perfil, porque reputação pode mudar) */
export function useInvalidarMutirao() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['mutirao'] });
    qc.invalidateQueries({ queryKey: ['perfil'] });
  };
}

export function useAtualizarTarefa() {
  const invalidar = useInvalidarMutirao();
  return useMutation({
    mutationFn: (v: { id: string; campos: Parameters<typeof s.atualizarTarefa>[1] }) => s.atualizarTarefa(v.id, v.campos),
    onSuccess: invalidar,
  });
}
