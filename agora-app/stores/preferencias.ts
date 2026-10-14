import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PreferenciaTema = 'sistema' | 'claro' | 'escuro';

interface EstadoPreferencias {
  tema: PreferenciaTema;
  boasVindasVistas: boolean;
  filtroMutirao: 'meu_nucleo' | 'todos';
  filtroAssembleia: 'geral' | 'meu_nucleo';
  definirTema: (t: PreferenciaTema) => void;
  marcarBoasVindas: () => void;
  definirFiltroMutirao: (f: 'meu_nucleo' | 'todos') => void;
  definirFiltroAssembleia: (f: 'geral' | 'meu_nucleo') => void;
}

export const usePreferencias = create<EstadoPreferencias>()(
  persist(
    (set) => ({
      tema: 'sistema',
      boasVindasVistas: false,
      filtroMutirao: 'meu_nucleo',
      filtroAssembleia: 'geral',
      definirTema: (tema) => set({ tema }),
      marcarBoasVindas: () => set({ boasVindasVistas: true }),
      definirFiltroMutirao: (filtroMutirao) => set({ filtroMutirao }),
      definirFiltroAssembleia: (filtroAssembleia) => set({ filtroAssembleia }),
    }),
    { name: 'agora-preferencias', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
