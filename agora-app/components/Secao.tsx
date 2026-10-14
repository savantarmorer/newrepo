import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { Texto } from './Texto';

export function Secao({ titulo, acao, children }: { titulo: string; acao?: { rotulo: string; onPress: () => void }; children: ReactNode }) {
  const { espaco } = useTema();
  return (
    <View style={{ gap: espaco.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Texto variante="secao" cor="secundario" accessibilityRole="header">{titulo}</Texto>
        {acao ? (
          <Pressable accessibilityRole="link" onPress={acao.onPress} hitSlop={12} style={{ minHeight: 32, justifyContent: 'center' }}>
            <Texto variante="rotulo" cor="primaria">{acao.rotulo}</Texto>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
