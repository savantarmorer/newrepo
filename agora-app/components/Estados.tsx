import { ActivityIndicator, View } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { textoDoErro } from '@/lib/erros';
import { Botao } from './Botao';
import { Texto } from './Texto';

export function Carregando({ texto }: { texto?: string }) {
  const { c } = useTema();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={texto ?? 'Carregando'} style={{ padding: 40, alignItems: 'center', gap: 12 }}>
      <ActivityIndicator color={c.primaria} />
      {texto ? <Texto cor="secundario">{texto}</Texto> : null}
    </View>
  );
}

export function Erro({ erro, aoTentar }: { erro: unknown; aoTentar?: () => void }) {
  return (
    <View style={{ padding: 32, alignItems: 'center', gap: 12 }} accessibilityRole="alert">
      <Texto variante="subtitulo" centro>Não foi possível carregar</Texto>
      <Texto cor="secundario" centro>{textoDoErro(erro)}</Texto>
      {aoTentar ? <Botao titulo="Tentar de novo" variante="secundario" onPress={aoTentar} style={{ alignSelf: 'center' }} /> : null}
    </View>
  );
}
