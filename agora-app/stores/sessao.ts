import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

interface EstadoSessao {
  sessao: Session | null;
  carregando: boolean;
  definir: (s: Session | null) => void;
}

export const useSessao = create<EstadoSessao>((set) => ({
  sessao: null,
  carregando: true,
  definir: (sessao) => set({ sessao, carregando: false }),
}));
