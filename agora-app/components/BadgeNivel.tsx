import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NOMES_NIVEIS } from '@/lib/constantes';
import { useTema } from '@/theme/ThemeProvider';
import { Texto } from './Texto';

/** Selo de nível — coluna jônica estilizada, cor por nível (dourado no Guardião). */
export function BadgeNivel({ nivel, compacto }: { nivel: number; compacto?: boolean }) {
  const { c, raio } = useTema();
  const n = (Math.min(4, Math.max(1, nivel)) as 1 | 2 | 3 | 4);
  const cor = c.niveis[n];
  return (
    <View
      accessible
      accessibilityLabel={`Nível ${n}: ${NOMES_NIVEIS[n]}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: compacto ? 6 : 10, paddingVertical: compacto ? 2 : 4, borderRadius: raio.pilula, borderWidth: 1, borderColor: cor, alignSelf: 'flex-start' }}
    >
      <Svg width={compacto ? 12 : 14} height={compacto ? 12 : 14} viewBox="0 0 24 24">
        <Path d="M3 4h18v2H3zM5 7h14v1H5zM6 9h2v10H6zM11 9h2v10h-2zM16 9h2v10h-2zM4 20h16v2H4z" fill={cor} />
      </Svg>
      <Texto variante="rotulo" style={{ color: cor, fontSize: compacto ? 12 : 13 }}>
        {compacto ? NOMES_NIVEIS[n] : `Nível ${n} · ${NOMES_NIVEIS[n]}`}
      </Texto>
    </View>
  );
}
