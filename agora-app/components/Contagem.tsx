import { useEffect, useState } from 'react';
import { contagemRegressiva } from '@/lib/formatos';
import { Texto, type TextoProps } from './Texto';

/** Contagem regressiva que se atualiza a cada 30s */
export function Contagem({ ate, prefixo = '', ...props }: { ate?: string | null; prefixo?: string } & TextoProps) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!ate) return null;
  return <Texto {...props}>{prefixo}{contagemRegressiva(ate)}</Texto>;
}
