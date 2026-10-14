import { View } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';

export function BarraProgresso({
  valor, cor, altura = 8, rotulo,
}: { valor: number; cor?: string; altura?: number; rotulo?: string }) {
  const { c } = useTema();
  const pct = Math.max(0, Math.min(1, valor));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={rotulo}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={{ height: altura, borderRadius: altura / 2, backgroundColor: c.superficieAfundada, overflow: 'hidden' }}
    >
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: cor ?? c.secundaria, borderRadius: altura / 2 }} />
    </View>
  );
}
