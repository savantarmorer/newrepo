import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { Texto } from './Texto';

export function Avatar({ nome, url, tamanho = 40 }: { nome?: string | null; url?: string | null; tamanho?: number }) {
  const { c } = useTema();
  const iniciais = (nome ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const estilo = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };
  if (url) {
    return <Image source={{ uri: url }} style={estilo} contentFit="cover" accessibilityLabel={`Foto de ${nome ?? 'membro'}`} />;
  }
  return (
    <View
      accessible
      accessibilityLabel={`Avatar de ${nome ?? 'membro'}`}
      style={[estilo, { backgroundColor: c.secundariaSuave, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borda }]}
    >
      <Texto variante="corpoForte" style={{ color: c.secundaria, fontSize: tamanho * 0.38, lineHeight: tamanho * 0.5 }}>
        {iniciais || '?'}
      </Texto>
    </View>
  );
}
