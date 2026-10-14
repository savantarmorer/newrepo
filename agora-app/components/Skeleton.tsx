import { useEffect, useRef } from 'react';
import { Animated, View, type DimensionValue } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';

export function Skeleton({ largura = '100%', altura = 16, raio = 6 }: { largura?: DimensionValue; altura?: number; raio?: number }) {
  const { c } = useTema();
  const opacidade = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacidade, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacidade]);
  return <Animated.View style={{ width: largura, height: altura, borderRadius: raio, backgroundColor: c.esqueleto, opacity: opacidade }} />;
}

/** Bloco de carregamento no formato de lista de cards */
export function SkeletonLista({ itens = 4 }: { itens?: number }) {
  const { c, espaco, raio } = useTema();
  return (
    <View accessibilityLabel="Carregando" accessibilityRole="progressbar" style={{ gap: espaco.md }}>
      {Array.from({ length: itens }).map((_, i) => (
        <View key={i} style={{ padding: espaco.lg, borderRadius: raio.lg, backgroundColor: c.superficie, gap: 10, borderWidth: 1, borderColor: c.borda }}>
          <Skeleton largura="70%" altura={18} />
          <Skeleton largura="100%" altura={12} />
          <Skeleton largura="40%" altura={12} />
        </View>
      ))}
    </View>
  );
}
