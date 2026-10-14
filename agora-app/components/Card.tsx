import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  rotulo?: string;
  destaque?: 'primaria' | 'dourado' | 'perigo' | 'secundaria';
  style?: ViewStyle;
  plano?: boolean;
}

export function Card({ children, onPress, rotulo, destaque, style, plano }: Props) {
  const { c, raio, espaco, sombra } = useTema();
  const borda = destaque
    ? { primaria: c.primaria, dourado: c.dourado, perigo: c.perigo, secundaria: c.secundaria }[destaque]
    : c.borda;
  const estilo: ViewStyle = {
    backgroundColor: c.superficie,
    borderRadius: raio.lg,
    padding: espaco.lg,
    borderWidth: 1,
    borderColor: borda,
    borderLeftWidth: destaque ? 4 : 1,
    ...(plano ? {} : sombra),
  };
  if (!onPress) return <View style={[estilo, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={({ pressed }) => [estilo, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] }, style]}
    >
      {children}
    </Pressable>
  );
}
