import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { useTema } from '@/theme/ThemeProvider';

export type NomeIcone = ComponentProps<typeof Feather>['name'];

export function Icone({ nome, tamanho = 20, cor }: { nome: NomeIcone; tamanho?: number; cor?: string }) {
  const { c } = useTema();
  return <Feather name={nome} size={tamanho} color={cor ?? c.texto} accessibilityElementsHidden importantForAccessibility="no" />;
}
