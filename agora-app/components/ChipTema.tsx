import { Pressable } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { ALVO_TOQUE } from '@/theme/tokens';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

interface Props {
  rotulo: string;
  selecionado?: boolean;
  onPress?: () => void;
  icone?: NomeIcone;
  tom?: 'neutro' | 'secundaria' | 'dourado' | 'primaria';
}

/** Chip de tema / filtro. Também usado como etiqueta estática quando não há onPress. */
export function ChipTema({ rotulo, selecionado, onPress, icone, tom = 'neutro' }: Props) {
  const { c, raio, espaco } = useTema();
  const cores = {
    neutro: { fundo: c.superficieAfundada, texto: c.textoSecundario },
    secundaria: { fundo: c.secundariaSuave, texto: c.secundaria },
    dourado: { fundo: c.douradoSuave, texto: c.douradoTexto },
    primaria: { fundo: c.primariaSuave, texto: c.primaria },
  }[tom];
  const fundo = selecionado ? c.secundaria : cores.fundo;
  const texto = selecionado ? c.textoSobreSecundaria : cores.texto;
  return (
    <Pressable
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected: !!selecionado } : undefined}
      accessibilityLabel={rotulo}
      onPress={onPress}
      hitSlop={onPress ? { top: 6, bottom: 6 } : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 6,
        minHeight: onPress ? Math.min(ALVO_TOQUE, 36) : 26,
        paddingHorizontal: onPress ? espaco.md : espaco.sm,
        paddingVertical: espaco.xs,
        borderRadius: raio.pilula,
        backgroundColor: fundo,
        opacity: pressed ? 0.8 : 1,
        borderWidth: 1,
        borderColor: selecionado ? c.secundaria : 'transparent',
      })}
    >
      {icone ? <Icone nome={icone} tamanho={14} cor={texto} /> : null}
      <Texto variante="rotulo" style={{ color: texto, fontSize: onPress ? 14 : 12.5 }}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}
