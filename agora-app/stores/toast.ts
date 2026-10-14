import { create } from 'zustand';

export type TipoToast = 'sucesso' | 'erro' | 'info';

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

interface EstadoToast {
  fila: Toast[];
  mostrar: (mensagem: string, tipo?: TipoToast) => void;
  remover: (id: number) => void;
}

let proximoId = 1;

export const useToast = create<EstadoToast>((set) => ({
  fila: [],
  mostrar: (mensagem, tipo = 'info') =>
    set((s) => ({ fila: [...s.fila.slice(-2), { id: proximoId++, tipo, mensagem }] })),
  remover: (id) => set((s) => ({ fila: s.fila.filter((t) => t.id !== id) })),
}));

/** Atalho fora de componentes */
export const toast = {
  sucesso: (m: string) => useToast.getState().mostrar(m, 'sucesso'),
  erro: (m: string) => useToast.getState().mostrar(m, 'erro'),
  info: (m: string) => useToast.getState().mostrar(m, 'info'),
};
