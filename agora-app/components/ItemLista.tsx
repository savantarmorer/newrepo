import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { ALVO_TOQUE } from '@/theme/tokens';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

export function ItemLista({
  titulo, subtitulo, icone, direita, onPress, perigo,
}: { titulo: string; subtitulo?: string; icone?: NomeIcone; direita?: ReactNode; onPress?: () => void; perigo?: boolean }) {
  const { c, espaco } = useTema();
  return (
    <Pressable
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={subtitulo ? `${titulo}. ${subtitulo}` : titulo}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: espaco.md, minHeight: ALVO_TOQUE + 8, paddingVertical: espaco.sm, opacity: pressed ? 0.7 : 1 })}
    >
      {icone ? <Icone nome={icone} cor={perigo ? c.perigo : c.textoSecundario} /> : null}
      <View style={{ flex: 1 }}>
        <Texto variante="corpo" cor={perigo ? 'perigo' : 'texto'}>{titulo}</Texto>
        {subtitulo ? <Texto variante="legenda" cor="secundario">{subtitulo}</Texto> : null}
      </View>
      {direita ?? (onPress ? <Icone nome="chevron-right" cor={c.textoSutil} /> : null)}
    </Pressable>
  );
}

export function Divisor() {
  const { c } = useTema();
  return <View style={{ height: 1, backgroundColor: c.borda }} />;
}
