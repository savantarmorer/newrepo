import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Carregando, Erro } from '@/components/Estados';
import { concluirLoginPorUrl } from '@/lib/auth';
import { useSessao } from '@/stores/sessao';
import { useTema } from '@/theme/ThemeProvider';

/** Destino do link mágico e do login com Google */
export default function Callback() {
  const { c } = useTema();
  const url = Linking.useLinkingURL();
  const sessao = useSessao((s) => s.sessao);
  const [erro, setErro] = useState<unknown>(null);
  useEffect(() => {
    if (url) concluirLoginPorUrl(url).catch(setErro);
  }, [url]);
  if (sessao) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1, backgroundColor: c.fundo, justifyContent: 'center' }}>
      {erro ? <Erro erro={erro} /> : <Carregando texto="Confirmando seu acesso…" />}
    </View>
  );
}
