import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { ALVO_TOQUE } from '@/theme/tokens';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

export type VarianteBotao = 'primario' | 'secundario' | 'fantasma' | 'perigo';

interface Props {
  titulo: string;
  onPress?: () => void;
  variante?: VarianteBotao;
  icone?: NomeIcone;
  carregando?: boolean;
  desabilitado?: boolean;
  compacto?: boolean;
  largura?: 'auto' | 'total';
  dica?: string;
  style?: ViewStyle;
}

export function Botao({
  titulo, onPress, variante = 'primario', icone, carregando, desabilitado, compacto, largura = 'auto', dica, style,
}: Props) {
  const { c, raio, espaco } = useTema();
  const inativo = desabilitado || carregando;
  const paleta = {
    primario: { fundo: c.primaria, pressionado: c.primariaPressionada, texto: c.textoSobrePrimaria, borda: c.primaria },
    secundario: { fundo: 'transparent', pressionado: c.primariaSuave, texto: c.primaria, borda: c.primaria },
    fantasma: { fundo: 'transparent', pressionado: c.superficieAfundada, texto: c.texto, borda: 'transparent' },
    perigo: { fundo: c.perigo, pressionado: c.perigo, texto: c.textoSobrePrimaria, borda: c.perigo },
  }[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      disabled={inativo}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
        onPress?.();
      }}
      style={({ pressed }) => [
        estilos.base,
        {
          minHeight: ALVO_TOQUE,
          paddingHorizontal: compacto ? espaco.md : espaco.xl,
          paddingVertical: compacto ? espaco.xs : espaco.md,
          borderRadius: raio.pilula,
          backgroundColor: pressed ? paleta.pressionado : paleta.fundo,
          borderColor: paleta.borda,
          opacity: inativo ? 0.55 : 1,
          alignSelf: largura === 'total' ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View style={estilos.conteudo}>
        {carregando ? (
          <ActivityIndicator color={paleta.texto} size="small" />
        ) : icone ? (
          <Icone nome={icone} tamanho={18} cor={paleta.texto} />
        ) : null}
        <Texto variante="botao" style={{ color: paleta.texto }} numberOfLines={1}>
          {titulo}
        </Texto>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: { borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
});

/** Botão só com ícone (alvo de toque de 44px) */
export function BotaoIcone({
  icone, rotulo, onPress, cor, badge,
}: { icone: NomeIcone; rotulo: string; onPress: () => void; cor?: string; badge?: number }) {
  const { c } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${rotulo}, ${badge} não lidas` : rotulo}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: ALVO_TOQUE, height: ALVO_TOQUE, borderRadius: ALVO_TOQUE / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: pressed ? c.superficieAfundada : 'transparent',
      })}
    >
      <Icone nome={icone} tamanho={22} cor={cor ?? c.texto} />
      {badge ? (
        <View style={{ position: 'absolute', top: 8, right: 8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: c.primaria, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
          <Texto variante="legenda" style={{ fontSize: 10, lineHeight: 12, color: c.textoSobrePrimaria }}>
            {badge > 9 ? '9+' : badge}
          </Texto>
        </View>
      ) : null}
    </Pressable>
  );
}
