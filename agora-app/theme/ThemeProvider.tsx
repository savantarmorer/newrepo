import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { usePreferencias } from '@/stores/preferencias';
import { cores, espaco, raio, tipografia, familias, sombra, type Cores, type NomeEsquema } from './tokens';

export interface Tema {
  esquema: NomeEsquema;
  c: Cores;
  espaco: typeof espaco;
  raio: typeof raio;
  tipografia: typeof tipografia;
  familias: typeof familias;
  sombra: ReturnType<typeof sombra>;
}

const ContextoTema = createContext<Tema | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();
  const preferencia = usePreferencias((s) => s.tema);
  const esquema: NomeEsquema =
    preferencia === 'sistema' ? (sistema === 'dark' ? 'escuro' : 'claro') : preferencia;

  const valor = useMemo<Tema>(
    () => ({ esquema, c: cores[esquema], espaco, raio, tipografia, familias, sombra: sombra(esquema) }),
    [esquema],
  );
  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>;
}

export function useTema(): Tema {
  const t = useContext(ContextoTema);
  if (!t) throw new Error('useTema precisa estar dentro de <ThemeProvider>');
  return t;
}
