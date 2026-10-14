import { useQuery } from '@tanstack/react-query';
import * as s from './services';

export const useMembrosAdmin = (termo: string) => useQuery({ queryKey: ['admin', 'membros', termo], queryFn: () => s.listarMembros(termo) });
export const useConfiguracoesAdmin = () => useQuery({ queryKey: ['admin', 'configuracoes'], queryFn: s.listarConfiguracoes });
export const useMetricas = () => useQuery({ queryKey: ['admin', 'metricas'], queryFn: s.metricas });
