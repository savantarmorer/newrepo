import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { guardarArtigoOffline, removerArtigoOffline } from '@/lib/offline';
import * as s from './services';

export const chavesBiblioteca = {
  temas: ['biblioteca', 'temas'] as const,
  tema: (slug: string) => ['biblioteca', 'tema', slug] as const,
  topicos: (filtro: object) => ['biblioteca', 'topicos', filtro] as const,
  topico: (id: string) => ['biblioteca', 'topico', id] as const,
  respostas: (id: string) => ['biblioteca', 'respostas', id] as const,
  artigos: (filtro: object) => ['biblioteca', 'artigos', filtro] as const,
  artigo: (id: string) => ['biblioteca', 'artigo', id] as const,
  revisoes: (id: string) => ['biblioteca', 'revisoes', id] as const,
  fila: ['biblioteca', 'fila-revisao'] as const,
  meusArtigos: ['biblioteca', 'meus-artigos'] as const,
  trilhas: (filtro: object) => ['biblioteca', 'trilhas', filtro] as const,
  trilha: (id: string) => ['biblioteca', 'trilha', id] as const,
  andamento: ['biblioteca', 'trilhas-andamento'] as const,
  curadas: ['biblioteca', 'trilhas-curadas'] as const,
  salvos: ['biblioteca', 'salvos'] as const,
  salvo: (tipo: string, id: string) => ['biblioteca', 'salvo', tipo, id] as const,
  acervo: (filtro: object) => ['biblioteca', 'acervo', filtro] as const,
  acervoResumo: ['biblioteca', 'acervo-resumo'] as const,
};

export const useTemas = () => useQuery({ queryKey: chavesBiblioteca.temas, queryFn: s.listarTemas, staleTime: 10 * 60_000 });
export const useTema = (slug?: string) =>
  useQuery({ queryKey: chavesBiblioteca.tema(slug ?? ''), queryFn: () => s.temaPorSlug(slug!), enabled: !!slug });

export function useTopicos(filtro: { temaId?: string; temaIds?: string[] }, ativo = true) {
  return useInfiniteQuery({
    queryKey: chavesBiblioteca.topicos(filtro),
    queryFn: ({ pageParam }) => s.listarTopicos({ ...filtro, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.proximo,
    enabled: ativo,
  });
}

export const useTopico = (id?: string) => useQuery({ queryKey: chavesBiblioteca.topico(id ?? ''), queryFn: () => s.buscarTopico(id!), enabled: !!id });
export const useRespostas = (id?: string) => useQuery({ queryKey: chavesBiblioteca.respostas(id ?? ''), queryFn: () => s.listarRespostas(id!), enabled: !!id });

export function useArtigos(filtro: { temaId?: string }) {
  return useInfiniteQuery({
    queryKey: chavesBiblioteca.artigos(filtro),
    queryFn: ({ pageParam }) => s.listarArtigos({ ...filtro, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.proximo,
  });
}

export const useArtigo = (id?: string) => useQuery({ queryKey: chavesBiblioteca.artigo(id ?? ''), queryFn: () => s.buscarArtigo(id!), enabled: !!id });
export const useRevisoes = (id?: string) => useQuery({ queryKey: chavesBiblioteca.revisoes(id ?? ''), queryFn: () => s.listarRevisoes(id!), enabled: !!id });
export const useFilaRevisao = () => useQuery({ queryKey: chavesBiblioteca.fila, queryFn: s.filaRevisao });
export const useMeusArtigos = () => useQuery({ queryKey: chavesBiblioteca.meusArtigos, queryFn: s.meusArtigos });

export const useTrilhas = (filtro: { temaId?: string; destaque?: boolean } = {}) =>
  useQuery({ queryKey: chavesBiblioteca.trilhas(filtro), queryFn: () => s.listarTrilhas(filtro) });
export const useTrilha = (id?: string) => useQuery({ queryKey: chavesBiblioteca.trilha(id ?? ''), queryFn: () => s.buscarTrilha(id!), enabled: !!id });
export const useTrilhasEmAndamento = () => useQuery({ queryKey: chavesBiblioteca.andamento, queryFn: s.trilhasEmAndamento });
export const useMinhasTrilhasCuradas = () => useQuery({ queryKey: chavesBiblioteca.curadas, queryFn: s.minhasTrilhasCuradas });
export const useArtigosPublicados = (termo: string) => useQuery({ queryKey: ['biblioteca', 'publicados', termo], queryFn: () => s.artigosPublicados(termo) });

export const useSalvos = () => useQuery({ queryKey: chavesBiblioteca.salvos, queryFn: s.listarSalvos });
export const useEstaSalvo = (tipo: s.TipoSalvo, id?: string) =>
  useQuery({ queryKey: chavesBiblioteca.salvo(tipo, id ?? ''), queryFn: () => s.estaSalvo(tipo, id!), enabled: !!id });

/** Salva/remove; para artigos, guarda também a cópia offline */
export function useAlternarSalvo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { tipo: s.TipoSalvo; id: string; salvar: boolean; artigoOffline?: Parameters<typeof guardarArtigoOffline>[0] }) => {
      await s.alternarSalvo(v.tipo, v.id, v.salvar);
      if (v.tipo === 'artigo') {
        if (v.salvar && v.artigoOffline) await guardarArtigoOffline(v.artigoOffline);
        if (!v.salvar) await removerArtigoOffline(v.id);
      }
    },
    onMutate: async (v) => {
      qc.setQueryData(chavesBiblioteca.salvo(v.tipo, v.id), v.salvar);
    },
    onSettled: (_d, _e, v) => {
      qc.invalidateQueries({ queryKey: chavesBiblioteca.salvos });
      qc.invalidateQueries({ queryKey: chavesBiblioteca.salvo(v.tipo, v.id) });
    },
  });
}

export function useInvalidarBiblioteca() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['biblioteca'] });
}

export function useAcervo(filtro: s.FiltroAcervo) {
  return useInfiniteQuery({
    queryKey: chavesBiblioteca.acervo(filtro),
    queryFn: ({ pageParam }) => s.buscarAcervo(filtro, pageParam),
    initialPageParam: 0,
    getNextPageParam: (ultima, todas) => (ultima.length < s.TAMANHO_PAGINA_ACERVO ? undefined : todas.length),
  });
}

export const useResumoAcervo = () => useQuery({ queryKey: chavesBiblioteca.acervoResumo, queryFn: s.resumoAcervo, staleTime: 60 * 60_000 });
