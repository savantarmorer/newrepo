import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useTrilha } from '@/features/biblioteca/hooks';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { formatarDataLonga } from '@/lib/formatos';
import { useTema } from '@/theme/ThemeProvider';

/** Tela comemorativa + "certificado simples" ao concluir uma trilha */
export default function TrilhaConcluida() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, raio, espaco } = useTema();
  const { data } = useTrilha(id);
  const { data: perfil } = useMeuPerfil();
  const nome = perfil?.pseudonimo_ativo ? perfil.pseudonimo : perfil?.nome_exibicao;
  return (
    <Tela>
      <View style={{ alignItems: 'center', gap: espaco.md, paddingTop: espaco.xl }}>
        <Svg width={140} height={140} viewBox="0 0 140 140" accessibilityLabel="Coroa de louros">
          <Circle cx={70} cy={70} r={64} fill={c.douradoSuave} />
          <Path d="M40 92c-14-20-10-46 8-60M100 92c14-20 10-46-8-60" stroke={c.dourado} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path d="M44 50l-10-4M42 64l-12 0M44 78l-11 5M96 50l10-4M98 64l12 0M96 78l11 5" stroke={c.dourado} strokeWidth={5} strokeLinecap="round" />
          <Path d="M58 74l8 8 18-20" stroke={c.secundaria} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Texto variante="display" centro>Parabéns!</Texto>
        <Texto variante="leitura" cor="secundario" centro>Você concluiu uma trilha da Biblioteca.</Texto>
      </View>
      <View style={{ borderWidth: 2, borderColor: c.dourado, borderRadius: raio.lg, padding: espaco.xl, gap: 8, backgroundColor: c.superficie }} accessible accessibilityLabel={`Certificado: ${nome} concluiu a trilha ${data?.trilha.titulo}`}>
        <Texto variante="secao" cor="dourado" centro>Certificado de conclusão</Texto>
        <Texto variante="subtitulo" centro>{nome}</Texto>
        <Texto cor="secundario" centro>concluiu a trilha</Texto>
        <Texto variante="titulo" centro style={{ fontSize: 26 }}>{data?.trilha.titulo}</Texto>
        <Texto variante="legenda" cor="sutil" centro>Ágora · {formatarDataLonga(new Date().toISOString())}</Texto>
      </View>
      <Botao titulo="Ver no meu perfil" largura="total" onPress={() => router.replace('/perfil')} />
      <Botao titulo="Voltar à Biblioteca" variante="fantasma" largura="total" onPress={() => router.dismissTo('/biblioteca')} />
    </Tela>
  );
}
