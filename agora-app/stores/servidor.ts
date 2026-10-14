import { create } from 'zustand';
import type { Servidor } from '@/lib/servidor';

interface EstadoServidor {
  servidor: Servidor | null;
  carregado: boolean;
  /** muda a cada troca de servidor: reinicia a escuta de sessão e o cache */
  versao: number;
  definir: (s: Servidor | null) => void;
}

export const useServidor = create<EstadoServidor>((set) => ({
  servidor: null,
  carregado: false,
  versao: 0,
  definir: (servidor) => set((e) => ({ servidor, carregado: true, versao: e.versao + 1 })),
}));
