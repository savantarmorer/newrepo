import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTema } from '@/theme/ThemeProvider';
import { Botao } from './Botao';
import { Texto } from './Texto';

type Ilustracao = 'templo' | 'livro' | 'maos' | 'urna' | 'lupa' | 'sino';

function Desenho({ tipo, cor, suave }: { tipo: Ilustracao; cor: string; suave: string }) {
  switch (tipo) {
    case 'livro':
      return (
        <Svg width={120} height={96} viewBox="0 0 120 96">
          <Circle cx={60} cy={50} r={44} fill={suave} />
          <Path d="M22 30c14-6 26-6 38 2v48c-12-8-24-8-38-2z" fill="none" stroke={cor} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M98 30c-14-6-26-6-38 2v48c12-8 24-8 38-2z" fill="none" stroke={cor} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M32 42h18M32 52h18M70 42h18M70 52h14" stroke={cor} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        </Svg>
      );
    case 'maos':
      return (
        <Svg width={120} height={96} viewBox="0 0 120 96">
          <Circle cx={60} cy={50} r={44} fill={suave} />
          <Path d="M20 62c10-2 18 2 26 8l12 8c4 3 10 2 12-2" fill="none" stroke={cor} strokeWidth={3} strokeLinecap="round" />
          <Path d="M100 62c-10-2-18 2-26 8" fill="none" stroke={cor} strokeWidth={3} strokeLinecap="round" />
          <Path d="M60 26c-6-8-18-4-16 6 2 8 16 16 16 16s14-8 16-16c2-10-10-14-16-6z" fill={cor} opacity={0.85} />
        </Svg>
      );
    case 'urna':
      return (
        <Svg width={120} height={96} viewBox="0 0 120 96">
          <Circle cx={60} cy={50} r={44} fill={suave} />
          <Rect x={32} y={44} width={56} height={36} rx={4} fill="none" stroke={cor} strokeWidth={3} />
          <Path d="M48 44h24" stroke={cor} strokeWidth={4} strokeLinecap="round" />
          <Path d="M52 20h22l-4 22H56z" fill={cor} opacity={0.8} />
        </Svg>
      );
    case 'lupa':
      return (
        <Svg width={120} height={96} viewBox="0 0 120 96">
          <Circle cx={60} cy={50} r={44} fill={suave} />
          <Circle cx={54} cy={44} r={18} fill="none" stroke={cor} strokeWidth={3} />
          <Path d="M67 57l16 16" stroke={cor} strokeWidth={4} strokeLinecap="round" />
        </Svg>
      );
    case 'sino':
      return (
        <Svg width={120} height={96} viewBox="0 0 120 96">
          <Circle cx={60} cy={50} r={44} fill={suave} />
          <Path d="M42 66h36l-4-6V44a14 14 0 0 0-28 0v16z" fill="none" stroke={cor} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M55 72a5 5 0 0 0 10 0" stroke={cor} strokeWidth={3} fill="none" />
        </Svg>
      );
    default:
      return (
        <Svg width={120} height={96} viewBox="0 0 120 96">
          <Circle cx={60} cy={50} r={44} fill={suave} />
          <Path d="M28 38L60 20l32 18z" fill={cor} opacity={0.85} />
          <Path d="M34 42v30M48 42v30M72 42v30M86 42v30" stroke={cor} strokeWidth={4} strokeLinecap="round" />
          <Path d="M26 78h68" stroke={cor} strokeWidth={4} strokeLinecap="round" />
        </Svg>
      );
  }
}

interface Props {
  titulo: string;
  descricao?: string;
  acao?: { titulo: string; onPress: () => void };
  ilustracao?: Ilustracao;
}

/** Todo estado vazio convida e oferece uma ação. */
export function EstadoVazio({ titulo, descricao, acao, ilustracao = 'templo' }: Props) {
  const { c, espaco } = useTema();
  return (
    <View style={{ alignItems: 'center', paddingVertical: espaco.xxxl, paddingHorizontal: espaco.xl, gap: espaco.md }}>
      <Desenho tipo={ilustracao} cor={c.primaria} suave={c.primariaSuave} />
      <Texto variante="subtitulo" centro>{titulo}</Texto>
      {descricao ? <Texto variante="corpo" cor="secundario" centro>{descricao}</Texto> : null}
      {acao ? <Botao titulo={acao.titulo} onPress={acao.onPress} variante="secundario" style={{ alignSelf: 'center', marginTop: espaco.sm }} /> : null}
    </View>
  );
}
