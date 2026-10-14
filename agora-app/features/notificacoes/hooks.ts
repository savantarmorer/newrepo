import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSessao } from '@/stores/sessao';
import * as s from './services';

export function useNaoLidas() {
  const sessao = useSessao((st) => st.sessao);
  return useQuery({ queryKey: ['notificacoes', 'nao-lidas'], queryFn: s.contarNaoLidas, enabled: !!sessao, refetchInterval: 60_000 });
}

export function useNotificacoes() {
  return useInfiniteQuery({
    queryKey: ['notificacoes', 'lista'],
    queryFn: ({ pageParam }) => s.listarNotificacoes(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (ultima) => (ultima.length === 30 ? ultima[ultima.length - 1]!.created_at : null),
  });
}

export function useMarcarLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => (id ? s.marcarLida(id) : s.marcarTodasLidas()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });
}

/** Realtime: atualiza o sino assim que chega notificação nova */
export function useNotificacoesTempoReal() {
  const sessao = useSessao((st) => st.sessao);
  const qc = useQueryClient();
  useEffect(() => {
    if (!sessao) return;
    const canal = supabase
      .channel(`notificacoes:${sessao.user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `profile_id=eq.${sessao.user.id}` }, () =>
        qc.invalidateQueries({ queryKey: ['notificacoes'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [sessao, qc]);
}
