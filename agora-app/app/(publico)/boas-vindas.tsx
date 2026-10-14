import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Botao } from '@/components/Botao';
import { Texto } from '@/components/Texto';
import { usePreferencias } from '@/stores/preferencias';
import { useTema } from '@/theme/ThemeProvider';

const SLIDES = [
  {
    titulo: 'Uma praça para pensar junto',
    texto: 'A Ágora é uma comunidade brasileira onde membros ensinam e aprendem uns com os outros: filosofia, direito, política, história, esoterismo, tarô e muito mais.',
    desenho: 'templo',
  },
  {
    titulo: 'Conhecimento que fica',
    texto: 'Nada se perde num chat. Discussões viram artigos revisados por pares, que viram trilhas de estudo. Sem feed algorítmico, sem curtidas, sem seguidores.',
    desenho: 'livro',
  },
  {
    titulo: 'Das ideias às ações',
    texto: 'Organizamos mutirões e ações solidárias com caixa 100% transparente. Quem contribui ganha voz — por contribuição verificável, não por popularidade.',
    desenho: 'maos',
  },
] as const;

function Ilustracao({ tipo }: { tipo: string }) {
  const { c } = useTema();
  return (
    <Svg width={220} height={180} viewBox="0 0 220 180">
      <Circle cx={110} cy={92} r={84} fill={c.primariaSuave} />
      {tipo === 'templo' && (
        <>
          <Path d="M40 70L110 32l70 38z" fill={c.primaria} />
          <Path d="M54 76v62M82 76v62M138 76v62M166 76v62" stroke={c.primaria} strokeWidth={9} strokeLinecap="round" />
          <Path d="M36 146h148" stroke={c.dourado} strokeWidth={8} strokeLinecap="round" />
        </>
      )}
      {tipo === 'livro' && (
        <>
          <Path d="M42 56c24-10 46-10 68 4v86c-22-14-44-14-68-4z" fill="none" stroke={c.primaria} strokeWidth={6} strokeLinejoin="round" />
          <Path d="M178 56c-24-10-46-10-68 4v86c22-14 44-14 68-4z" fill="none" stroke={c.primaria} strokeWidth={6} strokeLinejoin="round" />
          <Path d="M58 80h34M58 98h34M128 80h34M128 98h26" stroke={c.dourado} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
      {tipo === 'maos' && (
        <>
          <Path d="M30 120c20-4 34 4 50 14l22 14c8 6 18 4 22-4" fill="none" stroke={c.primaria} strokeWidth={7} strokeLinecap="round" />
          <Path d="M190 120c-20-4-34 4-50 14" fill="none" stroke={c.primaria} strokeWidth={7} strokeLinecap="round" />
          <Path d="M110 50c-10-14-32-8-28 10 4 16 28 30 28 30s24-14 28-30c4-18-18-24-28-10z" fill={c.dourado} />
        </>
      )}
    </Svg>
  );
}

export default function BoasVindas() {
  const { c, espaco } = useTema();
  const { width } = useWindowDimensions();
  const [indice, setIndice] = useState(0);
  const lista = useRef<FlatList>(null);
  const marcar = usePreferencias((s) => s.marcarBoasVindas);
  const ultimo = indice === SLIDES.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.fundo }}>
      <View style={{ alignItems: 'center', paddingTop: espaco.xl }}>
        <Texto variante="display" cor="primaria" accessibilityRole="header">Ágora</Texto>
      </View>
      <FlatList
        ref={lista}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.titulo}
        onMomentumScrollEnd={(e) => setIndice(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, padding: espaco.xxl, alignItems: 'center', justifyContent: 'center', gap: espaco.lg }}>
            <Ilustracao tipo={item.desenho} />
            <Texto variante="titulo" centro>{item.titulo}</Texto>
            <Texto variante="leitura" cor="secundario" centro style={{ fontSize: 17, lineHeight: 27 }}>{item.texto}</Texto>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: espaco.lg }} accessibilityLabel={`Tela ${indice + 1} de ${SLIDES.length}`}>
        {SLIDES.map((s, i) => (
          <View key={s.titulo} style={{ width: i === indice ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === indice ? c.primaria : c.bordaForte }} />
        ))}
      </View>
      <View style={{ padding: espaco.xl, gap: espaco.md }}>
        <Botao
          titulo={ultimo ? 'Entrar na Ágora' : 'Continuar'}
          largura="total"
          onPress={() => {
            if (!ultimo) {
              lista.current?.scrollToIndex({ index: indice + 1 });
              setIndice(indice + 1);
              return;
            }
            marcar();
            router.push('/entrar');
          }}
        />
        <Botao titulo="Conhecer a comunidade" variante="fantasma" largura="total" onPress={() => router.push('/sobre')} />
      </View>
    </SafeAreaView>
  );
}
